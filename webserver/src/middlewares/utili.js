const db = require("../models");
const Material = db.material;




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

const checkRenamePermission = async (req, res, next) => {
    const materialId = req.params.materialId;

    try {
        // Fetch the material to determine its type
        const material = await Material.findById(materialId);

        if (!material) {
            return res.status(404).send({ error: `Material not found!` });
        }

        if (material.type === 'pdf') {
            if (!utili.permissionsChecker(req, 'can_rename_pdfs')) {
                return res.status(403).send({ error: "You don't have permission to rename PDFs!" });
            }
        } else if (material.type === 'video') {
            if (!utili.permissionsChecker(req, 'can_rename_materials')) {
                return res.status(403).send({ error: "You don't have permission to rename videos!" });
            }
        }

        // Proceed to the next middleware or controller if permission is granted
        return next();
    } catch (error) {
        console.error("Error fetching material or checking permissions:", error);
        return res.status(500).send({ error: "Internal Server Error." });
    }
};


const utili = {
    isPermissionAllowed,
    permissionsChecker,
    checkRenamePermission
};
module.exports = utili;