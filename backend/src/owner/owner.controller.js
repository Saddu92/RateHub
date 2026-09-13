const ownerService = require("./owner.service");

const createStore = async (req, res) => {
  try {
    const store = await ownerService.createStore({
      ...req.body,
      ownerId: req.user.id,
    });
    res.status(201).json({
      success: true,
      message: "Store created successfully",
      data: store,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Could not create store",
    });
  }
};

const getDashboard = async (req, res) => {
  try {
    const data = await ownerService.getDashboard(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to load owner dashboard",
    });
  }
};

module.exports = { createStore, getDashboard };
