export const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: {
            message: `Route ${req.originalUrl} not found`
        }
    });
};
//# sourceMappingURL=notFound.js.map