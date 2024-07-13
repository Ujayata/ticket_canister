const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const users = new Map(); // In-memory user store

const secretKey = 'your_secret_key'; // Use a secure key in production

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const generateToken = (user) => {
    return jwt.sign(user, secretKey, { expiresIn: '1h' });
};

const registerUser = (username, password) => {
    if (users.has(username)) throw new Error('User already exists');
    const hashedPassword = bcrypt.hashSync(password, 10);
    users.set(username, { username, password: hashedPassword });
};

const loginUser = (username, password) => {
    const user = users.get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
        throw new Error('Invalid credentials');
    }
    return generateToken({ username });
};

module.exports = { authenticateToken, registerUser, loginUser };
