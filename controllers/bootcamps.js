const path = require('path');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Bootcamp = require('../models/Bootcamp');

// @desc      Get all bootcamps
// @route     GET /api/v1/bootcamps
// @access    Public
exports.getBootcamps = asyncHandler(async(req, res, next) => {
    res.status(200).json(res.advancedResults);
});

// @desc      Get single bootcamp
// @route     GET /api/v1/bootcamps/:id
// @access    Public
exports.getBootcamp = asyncHandler(async(req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        );
    }

    res.status(200).json({ success: true, data: bootcamp });
});

// @desc      Create new bootcamp
// @route     POST /api/v1/bootcamps
// @access    Private
exports.createBootcamp = asyncHandler(async(req, res, next) => {
    // Add user to req,body
    req.body.user = req.user.id;

    // Check for published bootcamp
    const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

    // If the user is not an admin, they can only add one bootcamp
    if (publishedBootcamp && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `The user with ID ${req.user.id} has already published a bootcamp`,
                400
            )
        );
    }

    const bootcamp = await Bootcamp.create(req.body);

    res.status(201).json({
        success: true,
        data: bootcamp,
    });
});

// @desc      Update bootcamp
// @route     PUT /api/v1/bootcamps/:id
// @access    Private
exports.updateBootcamp = asyncHandler(async(req, res, next) => {
    let bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        );
    }

    // Make sure user is bootcamp owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `User ${req.params.id} is not authorized to update this bootcamp`,
                401
            )
        );
    }

    bootcamp = await Bootcamp.findOneAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({ success: true, data: bootcamp });
});

// @desc      Delete bootcamp
// @route     DELETE /api/v1/bootcamps/:id
// @access    Private
exports.deleteBootcamp = asyncHandler(async(req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        );
    }

    // Make sure user is bootcamp owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `User ${req.params.id} is not authorized to delete this bootcamp`,
                401
            )
        );
    }

    bootcamp.remove();

    res.status(200).json({ success: true, data: {} });
});

// @desc      Get stat bootcamp by jobs assistance and carre
// @route     Get /api/v1/bootcamps/:id
// @access    Public
// using aggregate

exports.getBootcampsCategory = asyncHandler(async(req, res, next) => {
    const BootcampStat = await Bootcamp.aggregate([
        { $unwind: '$careers' },
        {
            $group: {
                _id: { jobAssistance: '$jobAssistance' },
                sum: { $sum: 1 },
                allCarreers: { $addToSet: '$careers' },
            },
        },
    ]);

    const BootcampStatjob = await Bootcamp.aggregate([
        { $unwind: '$careers' },
        {
            $group: {
                _id: { jobGuarantee: '$jobGuarantee' },
                sum: { $sum: 1 },
                allCarreers: { $addToSet: '$careers' },
            },
        },
    ]);

    const BootcampStatHousing = await Bootcamp.aggregate([
        { $unwind: '$careers' },
        {
            $group: {
                _id: { jobGuarantee: '$housing' },
                sum: { $sum: 1 },
                allCarreers: { $addToSet: '$careers' },
            },
        },
    ]);

    res.status(200).json({
        success: true,
        data: {
            jobAssistance: BootcampStat,
            jobGuarantee: BootcampStatjob,
            housing: BootcampStatHousing,
        },
    });
});