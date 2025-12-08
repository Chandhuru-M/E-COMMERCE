const sendToken = (user, statusCode, res) => {
    // Create Token
    // Check for both common naming conventions to prevent 500 errors if model differs
    const token = user.getJWTToken ? user.getJWTToken() : user.getJwtToken();

    // options for cookie
    const options = {
        expires: new Date(
            // Fallback to 5 days if COOKIE_EXPIRE is missing or invalid
            Date.now() + (Number(process.env.COOKIE_EXPIRE) || 5) * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        // Only mark cookie as secure in production (HTTPS). 
        // This fixes 401 errors on localhost (HTTP).
        secure: process.env.NODE_ENV === 'production',
    };

    res.status(statusCode).cookie("token", token, options).json({
        success: true,
        user,
        token,
    });
};

module.exports = sendToken;