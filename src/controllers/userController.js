const User = require('../models/User');
const NodeCache = require('node-cache');
const userCache = new NodeCache({ stdTTL: 3600 }); // Cache users for 1 hour to reduce DB hits

exports.createUser = async (req, res) => {
    try {
        const { name, age } = req.body;
        if (!name || !age) {
            return res.status(400).json({ error: 'Name and age are required' });
        }
        let user = new User({ name, age });
        await user.save();
        userCache.set(user._id.toString(), user);
        
        // Disable cache on mongoose object by transforming it to JSON
        res.status(201).json(user.toJSON());
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getUser = async (req, res) => {
    try {
        const { id } = req.params;
        let user = userCache.get(id);
        if (!user) {
            user = await User.findById(id);
            if (!user) return res.status(404).json({ error: 'User not found' });
            userCache.set(id, user.toJSON());
        } else {
             // always return DB obj for victories just to be safe if it updated, but this is a simple cache
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
