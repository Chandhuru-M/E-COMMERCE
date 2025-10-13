import dotenv from 'dotenv';
import { z } from 'zod';
if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}
const envSchema = z.object({
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Service role key is required'),
    SUPABASE_ANON_KEY: z.string().min(1, 'Anon key is required'),
    PORT: z.string().default('4000'),
    STRIPE_SECRET_KEY: z.string().optional()
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment configuration', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
}
export const env = parsed.data;
//# sourceMappingURL=env.js.map