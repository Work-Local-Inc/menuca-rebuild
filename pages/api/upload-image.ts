import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, filename, restaurantId } = req.body;

    if (!image || !filename) {
      return res.status(400).json({ error: 'Image and filename required' });
    }

    // Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const fileExt = (filename.split('.').pop() || 'png').toLowerCase();
    const uniqueFilename = `${restaurantId || 'temp'}-${Date.now()}.${fileExt}`;
    const filePath = `restaurant-images/${uniqueFilename}`;

    // Upload to Supabase Storage using admin client
    let { error: uploadError } = await supabaseAdmin.storage
      .from('restaurant-assets')
      .upload(filePath, buffer, {
        contentType: `image/${fileExt}`,
        upsert: true
      });

    if (uploadError) {
      // If bucket doesn't exist, try to create then retry
      if ((uploadError as any)?.message?.includes('Bucket not found')) {
        const { error: createError } = await supabaseAdmin.storage.createBucket('restaurant-assets', {
          public: true
        });
        if (!createError) {
          const retry = await supabaseAdmin.storage
            .from('restaurant-assets')
            .upload(filePath, buffer, {
              contentType: `image/${fileExt}`,
              upsert: true
            });
          uploadError = retry.error || null;
        }
      }
    }

    if (uploadError) {
      return res.status(500).json({ error: 'Failed to upload image', details: uploadError.message || uploadError });
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('restaurant-assets')
      .getPublicUrl(filePath);

    return res.status(200).json({ url: publicUrlData.publicUrl });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal server error',
      details: (error as any)?.message || 'Unknown error'
    });
  }
}
