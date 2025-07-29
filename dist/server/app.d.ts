import { Application } from 'express';
declare class MenuCAServer {
    app: Application;
    private server;
    constructor();
    private initializeMiddleware;
    private tenantContextMiddleware;
    private initializeRoutes;
    private healthCheck;
    private systemStatus;
    private initializeErrorHandling;
    start(): Promise<void>;
    private setupGracefulShutdown;
    getApp(): Application;
}
export default MenuCAServer;
//# sourceMappingURL=app.d.ts.map