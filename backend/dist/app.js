import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFound';
import routes from './routes/index';
export const createApp = () => {
    const app = express();
    app.use(helmet());
    app.use(cors({ origin: '*' }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(morgan('dev'));
    app.use('/api', routes);
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
};
//# sourceMappingURL=app.js.map