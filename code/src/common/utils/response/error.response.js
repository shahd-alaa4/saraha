export const errorException = ({ message = "fail", cause = undefined } = {}) => {
  throw new Error(message, { cause });

}

export const badRequestException = ({ message = "Bad Request", extra = {} } = {}) => {
  return errorException({ message, status: 400, extra });

};

export const unauthorizedException = ({ message = "Unauthorized", extra = {} } = {}) => {
  return errorException({ message, status: 401, extra });


};

export const forbiddenException = ({ message = "Forbidden", extra = {} } = {}) => {
  return errorException({ message, status: 403, extra });

};


export const notfoundException = ({ message, extra = {} } = {}) => {
  errorException({ message, cause: { status: 404 }, extra })

}


export const conflictException = ({ message = "Conflict", extra = {} } = {}) => {
  return errorException({ message, status: 409, extra });

};

export const internalException = ({ message = "Internal Server Error", extra = {} } = {}) => {
  return errorException({ message, status: 500, extra });

};
