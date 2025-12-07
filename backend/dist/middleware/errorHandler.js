export class HttpError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.status = status;
    }
}
export const errorHandler = (err, _req, res) => {
    const status = err instanceof HttpError ? err.status : 500;
    res.status(status).json({
        error: {
            message: err.message || 'Unexpected error occurred'
        }
    });
};
//# sourceMappingURL=errorHandler.js.map