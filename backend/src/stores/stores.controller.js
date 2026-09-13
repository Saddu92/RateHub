const storesService = require("./stores.services");

const getStores = async (req, res) => {
  try {
    const data = await storesService.getStores({
      ...req.query,
      userId: req.user.id,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch stores" });
  }
};

const getStoreById = async (req, res) => {
  try {
    const data = await storesService.getStoreById(req.params.id, req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message || "Store not found" });
  }
};

const submitRating = async (req, res) => {
  try {
    const data = await storesService.submitRating(req.user.id, req.params.id, req.body.rating);
    res.status(201).json({ success: true, message: "Rating submitted", data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Unable to submit rating" });
  }
};

const updateRating = async (req, res) => {
  try {
    const data = await storesService.updateRating(req.user.id, req.params.id, req.body.rating);
    res.status(200).json({ success: true, message: "Rating updated", data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Unable to update rating" });
  }
};

module.exports = { getStores, getStoreById, submitRating, updateRating };
