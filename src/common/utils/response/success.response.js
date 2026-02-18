export const successResponse = ({ res, status = 200, data = undefined, message = "Done" } = {}) => {
    return res.status(status).json({ status, message, data: data })
}