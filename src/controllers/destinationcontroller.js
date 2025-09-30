const Destination = require('../models/destinations');

// Get all destinations
const getAllDestinations = async (req, res) => {
    try {
        const destinations = await Destination.find({ isActive: true });
        res.json({
        success: true,
        count: destinations.length,
        data: destinations
        });
    } catch (error) {
        res.status(500).json({
        success: false,
        message: 'Error fetching destinations',
        error: error.message
        });
    }
};

// Get single destination by ID
const getDestinationById = async (req, res) => {
    try {
        const destination = await Destination.findById(req.params.id);
        
        if (!destination) {
        return res.status(404).json({
            success: false,
            message: 'Destination not found'
        });
        }

        res.json({
        success: true,
        data: destination
        });
    } catch (error) {
        res.status(500).json({
        success: false,
        message: 'Error fetching destination',
        error: error.message
        });
    }
    };

    // Create new destination
    const createDestination = async (req, res) => {
    try {
        const destination = new Destination(req.body);
        await destination.save();
        
        res.status(201).json({
        success: true,
        data: destination
        });
    } catch (error) {
        res.status(400).json({
        success: false,
        message: 'Error creating destination',
        error: error.message
        });
    }
};

// Update destination
const updateDestination = async (req, res) => {
    try {
        const destination = await Destination.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
        );

        if (!destination) {
        return res.status(404).json({
            success: false,
            message: 'Destination not found'
        });
        }

        res.json({
        success: true,
        data: destination
        });
    } catch (error) {
        res.status(400).json({
        success: false,
        message: 'Error updating destination',
        error: error.message
        });
    }
};

// Delete destination (soft delete)
const deleteDestination = async (req, res) => {
    try {
        const destination = await Destination.findByIdAndUpdate(
        req.params.id,
        { isActive: false },
        { new: true }
        );

        if (!destination) {
        return res.status(404).json({
            success: false,
            message: 'Destination not found'
        });
        }

        res.json({
        success: true,
        message: 'Destination deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
        success: false,
        message: 'Error deleting destination',
        error: error.message
        });
    }
};

// Search destinations
const searchDestinations = async (req, res) => {
    try {
        const { name, location, minRating, maxPrice } = req.query;
        let query = { isActive: true };

        if (name) {
        query.name = { $regex: name, $options: 'i' };
        }

        if (location) {
        query.location = { $regex: location, $options: 'i' };
        }

        if (minRating) {
        query.rating = { $gte: parseFloat(minRating) };
        }

        if (maxPrice) {
        query.price = { $lte: parseFloat(maxPrice) };
        }

    const destinations = await Destination.find(query);
    
    res.json({
      success: true,
      count: destinations.length,
      data: destinations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching destinations',
      error: error.message
    });
  }
};

module.exports = {
  getAllDestinations,
  getDestinationById,
  createDestination,
  updateDestination,
  deleteDestination,
  searchDestinations
};
