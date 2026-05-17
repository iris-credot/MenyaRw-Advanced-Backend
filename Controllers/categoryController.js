const asyncWrapper = require('../Middleware/async');
const { NotFound, BadRequest } = require('../Error/index');
const Category = require('../Models/Category');
const Site = require('../Models/Site');

exports.createCategory = asyncWrapper(async (req, res, next) => {
  const { name, description, icon, color } = req.body;
  if (!name) return next(new BadRequest('Category name is required.'));

  const category = await Category.create({ name, description, icon, color, createdBy: req.userId });
  res.status(201).json({ success: true, category });
});

exports.getAllCategories = asyncWrapper(async (req, res) => {
  const categories = await Category.find({});
  // Attach site count per category
  const withCount = await Promise.all(
    categories.map(async (cat) => {
      const count = await Site.countDocuments({ category: cat._id, isPublished: true });
      return { ...cat.toObject(), siteCount: count };
    })
  );
  res.status(200).json({ success: true, categories: withCount });
});

exports.getCategoryById = asyncWrapper(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new NotFound('Category not found.'));
  res.status(200).json({ success: true, category });
});

exports.updateCategory = asyncWrapper(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!category) return next(new NotFound('Category not found.'));
  res.status(200).json({ success: true, category });
});

exports.deleteCategory = asyncWrapper(async (req, res, next) => {
  const inUse = await Site.exists({ category: req.params.id });
  if (inUse) return next(new BadRequest('Cannot delete a category that has associated sites.'));
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return next(new NotFound('Category not found.'));
  res.status(200).json({ success: true, message: 'Category deleted.' });
});