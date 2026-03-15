import { TokenTypeEname } from "../common/enums/security.enum.js"
import { decodeToken } from "../common/security/token.security.js"
import { badRequestException, forbiddenException } from "../common/utils/response/error.response.js"

export const authentication = (tokenType = TokenTypeEname.access) => {
    return async (req, res, next) => {


        const [flag, credential] = req.headers?.authorization.split(" ") || []
        // console.log({ flag, credential });


        if (!flag || !credential) {
            throw badRequestException({ message: "missing authorization parts" })
        }
        // console.log({ flag, credential });

        switch (flag) {
            case 'Basic':
                const [email, password] = Buffer.from(credential, 'base64').toString().split(":");
                // console.log(data);
                // console.log({ username, password });
                await login({ email, password }, `${req.protocol}://${req.host}`)
                break;

            case 'Bearer':
                const { user, decoded } = await decodeToken({ token: credential, tokenType })

                if (!user) {
                    throw badRequestException({ message: "Not Registered account or token invalid" });
                }
                req.user = user;
                req.decoded = decoded

                break;
        }

        next()
    }
}

export const authorization = (accessRoles = []) => {
    return async (req, res, next) => {
        if (!accessRoles.includes(req.user.role)) {
            throw forbiddenException({ message: "Not allowed account" })
        }
        next()
    }
}