


const isPermissionAllowed = (perm) => {
    return async (req, res, next) => {
        if (req.isAdmin || req.isModerator) {
            return next();
        }
        else if (req?.allowedPermissions?.get(perm)) {
            return next();
        } else {
            return res.status(403).send({ error: "You don't have permission to perform this task" });
        }
    };
};


const permissionsChecker = (req, perm) => {
    if (req.isAdmin || req.isModerator) {
        return true;
    }
    // Check if the specific permission is granted
    return req.allowedPermissions?.get(perm) || false;
};


const utili = {
    isPermissionAllowed,
    permissionsChecker
};
module.exports = utili;