"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const MenuService_1 = require("@/services/MenuService");
const auth_1 = require("@/middleware/auth");
const auth_2 = require("@/types/auth");
const winston_1 = __importDefault(require("winston"));
const router = express_1.default.Router();
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.json(),
    transports: [new winston_1.default.transports.Console()]
});
const menuService = new MenuService_1.MenuService();
// =========================================
// RESTAURANT ROUTES
// =========================================
// Get all restaurants (public)
router.get('/restaurants', async (req, res, next) => {
    try {
        const { page = 1, limit = 20, cuisine, featured, status = 'active' } = req.query;
        const filters = {
            cuisine: cuisine,
            featured: featured === 'true',
            status: status,
        };
        const result = await menuService.getRestaurants(req.tenantContext.tenantId, {
            page: parseInt(page),
            limit: parseInt(limit),
            filters
        });
        res.json(result);
    }
    catch (error) {
        logger.error('Failed to get restaurants:', error);
        next(error);
    }
});
// Get restaurant by ID (public)
router.get('/restaurants/:id', async (req, res, next) => {
    try {
        const restaurant = await menuService.getRestaurantById(req.tenantContext.tenantId, req.params.id);
        if (!restaurant) {
            res.status(404).json({ error: 'Restaurant not found' });
            return;
        }
        res.json(restaurant);
    }
    catch (error) {
        logger.error('Failed to get restaurant:', error);
        next(error);
    }
});
// Create restaurant (requires manager+ role)
router.post('/restaurants', auth_1.authenticateToken, (0, auth_1.requireRole)([auth_2.UserRole.MANAGER, auth_2.UserRole.ADMIN, auth_2.UserRole.SUPER_ADMIN]), async (req, res, next) => {
    try {
        const restaurant = await menuService.createRestaurant(req.tenantContext.tenantId, req.user.id, req.body);
        res.status(201).json(restaurant);
    }
    catch (error) {
        logger.error('Failed to create restaurant:', error);
        next(error);
    }
});
// Update restaurant (requires ownership or admin)
router.put('/restaurants/:id', auth_1.authenticateToken, async (req, res, next) => {
    try {
        // Check if user owns this restaurant or is admin
        const restaurant = await menuService.getRestaurantById(req.tenantContext.tenantId, req.params.id);
        if (!restaurant) {
            res.status(404).json({ error: 'Restaurant not found' });
            return;
        }
        if (restaurant.owner_id !== req.user.id && ![auth_2.UserRole.ADMIN, auth_2.UserRole.SUPER_ADMIN].includes(req.user.role)) {
            res.status(403).json({ error: 'Not authorized to update this restaurant' });
            return;
        }
        const updatedRestaurant = await menuService.updateRestaurant(req.tenantContext.tenantId, req.params.id, req.body);
        res.json(updatedRestaurant);
    }
    catch (error) {
        logger.error('Failed to update restaurant:', error);
        next(error);
    }
});
// =========================================
// MENU CATEGORY ROUTES
// =========================================
// Get categories for a restaurant
router.get('/restaurants/:restaurantId/categories', async (req, res, next) => {
    try {
        const categories = await menuService.getMenuCategories(req.tenantContext.tenantId, req.params.restaurantId);
        res.json(categories);
    }
    catch (error) {
        logger.error('Failed to get menu categories:', error);
        next(error);
    }
});
// Create menu category (requires restaurant ownership or admin)
router.post('/restaurants/:restaurantId/categories', auth_1.authenticateToken, async (req, res, next) => {
    try {
        // Verify restaurant ownership
        const restaurant = await menuService.getRestaurantById(req.tenantContext.tenantId, req.params.restaurantId);
        if (!restaurant) {
            res.status(404).json({ error: 'Restaurant not found' });
            return;
        }
        if (restaurant.owner_id !== req.user.id && ![auth_2.UserRole.ADMIN, auth_2.UserRole.SUPER_ADMIN].includes(req.user.role)) {
            res.status(403).json({ error: 'Not authorized to manage this restaurant' });
            return;
        }
        const category = await menuService.createMenuCategory(req.tenantContext.tenantId, req.params.restaurantId, req.body);
        res.status(201).json(category);
    }
    catch (error) {
        logger.error('Failed to create menu category:', error);
        next(error);
    }
});
// =========================================
// MENU ITEM ROUTES
// =========================================
// Get menu items for a restaurant
router.get('/restaurants/:restaurantId/menu', async (req, res, next) => {
    try {
        const { category, status = 'available', featured } = req.query;
        const filters = {
            category: category,
            status: status,
            featured: featured === 'true'
        };
        const menuItems = await menuService.getMenuItems(req.tenantContext.tenantId, req.params.restaurantId, filters);
        res.json(menuItems);
    }
    catch (error) {
        logger.error('Failed to get menu items:', error);
        next(error);
    }
});
// Get single menu item
router.get('/restaurants/:restaurantId/menu/:itemId', async (req, res, next) => {
    try {
        const menuItem = await menuService.getMenuItemById(req.tenantContext.tenantId, req.params.restaurantId, req.params.itemId);
        if (!menuItem) {
            res.status(404).json({ error: 'Menu item not found' });
            return;
        }
        res.json(menuItem);
    }
    catch (error) {
        logger.error('Failed to get menu item:', error);
        next(error);
    }
});
// Create menu item (requires restaurant ownership or admin)
router.post('/restaurants/:restaurantId/menu', auth_1.authenticateToken, async (req, res, next) => {
    try {
        // Verify restaurant ownership
        const restaurant = await menuService.getRestaurantById(req.tenantContext.tenantId, req.params.restaurantId);
        if (!restaurant) {
            res.status(404).json({ error: 'Restaurant not found' });
            return;
        }
        if (restaurant.owner_id !== req.user.id && ![auth_2.UserRole.ADMIN, auth_2.UserRole.SUPER_ADMIN].includes(req.user.role)) {
            res.status(403).json({ error: 'Not authorized to manage this restaurant' });
            return;
        }
        const menuItem = await menuService.createMenuItem(req.tenantContext.tenantId, req.params.restaurantId, req.body);
        res.status(201).json(menuItem);
    }
    catch (error) {
        logger.error('Failed to create menu item:', error);
        next(error);
    }
});
// Update menu item (requires restaurant ownership or admin)
router.put('/restaurants/:restaurantId/menu/:itemId', auth_1.authenticateToken, async (req, res, next) => {
    try {
        // Verify restaurant ownership
        const restaurant = await menuService.getRestaurantById(req.tenantContext.tenantId, req.params.restaurantId);
        if (!restaurant) {
            res.status(404).json({ error: 'Restaurant not found' });
            return;
        }
        if (restaurant.owner_id !== req.user.id && ![auth_2.UserRole.ADMIN, auth_2.UserRole.SUPER_ADMIN].includes(req.user.role)) {
            res.status(403).json({ error: 'Not authorized to manage this restaurant' });
            return;
        }
        const menuItem = await menuService.updateMenuItem(req.tenantContext.tenantId, req.params.restaurantId, req.params.itemId, req.body);
        if (!menuItem) {
            res.status(404).json({ error: 'Menu item not found' });
            return;
        }
        res.json(menuItem);
    }
    catch (error) {
        logger.error('Failed to update menu item:', error);
        next(error);
    }
});
// Delete menu item (requires restaurant ownership or admin)
router.delete('/restaurants/:restaurantId/menu/:itemId', auth_1.authenticateToken, async (req, res, next) => {
    try {
        // Verify restaurant ownership
        const restaurant = await menuService.getRestaurantById(req.tenantContext.tenantId, req.params.restaurantId);
        if (!restaurant) {
            res.status(404).json({ error: 'Restaurant not found' });
            return;
        }
        if (restaurant.owner_id !== req.user.id && ![auth_2.UserRole.ADMIN, auth_2.UserRole.SUPER_ADMIN].includes(req.user.role)) {
            res.status(403).json({ error: 'Not authorized to manage this restaurant' });
            return;
        }
        const success = await menuService.deleteMenuItem(req.tenantContext.tenantId, req.params.restaurantId, req.params.itemId);
        if (!success) {
            res.status(404).json({ error: 'Menu item not found' });
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        logger.error('Failed to delete menu item:', error);
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=menu.js.map