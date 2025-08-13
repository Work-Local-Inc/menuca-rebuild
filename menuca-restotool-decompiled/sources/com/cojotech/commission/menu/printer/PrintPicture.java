package com.cojotech.commission.menu.printer;

import android.graphics.Bitmap;

/* loaded from: classes.dex */
public class PrintPicture {
    public static byte[] POS_PrintBMP(Bitmap bitmap, int i, int i2) {
        int i3 = ((i + 7) / 8) * 8;
        int height = ((((bitmap.getHeight() * i3) / bitmap.getWidth()) + 7) / 8) * 8;
        if (bitmap.getWidth() != i3) {
            bitmap = Utility.resizeImage(bitmap, i3, height);
        }
        return Utility.eachLinePixToCmd(Utility.thresholdToBWPic(Utility.toGrayscale(bitmap)), i3, i2);
    }

    public static byte[] Print_1D2A(Bitmap bitmap) {
        int width = bitmap.getWidth();
        int height = bitmap.getHeight();
        byte[] bArr = new byte[10240];
        bArr[0] = Command.GS;
        bArr[1] = 42;
        bArr[2] = (byte) (((width - 1) / 8) + 1);
        bArr[3] = (byte) (((height - 1) / 8) + 1);
        int i = 4;
        byte b = 0;
        byte b2 = 0;
        for (int i2 = 0; i2 < width; i2++) {
            System.out.println("进来了...I");
            byte b3 = b;
            int i3 = i;
            for (int i4 = 0; i4 < height; i4++) {
                System.out.println("进来了...J");
                if (bitmap.getPixel(i2, i4) != -1) {
                    b3 = (byte) (b3 | (128 >> b2));
                }
                b2 = (byte) (b2 + 1);
                if (b2 == 8) {
                    bArr[i3] = b3;
                    i3++;
                    b2 = 0;
                    b3 = 0;
                }
            }
            if (b2 % 8 != 0) {
                i = i3 + 1;
                bArr[i3] = b3;
                b = 0;
                b2 = 0;
            } else {
                i = i3;
                b = b3;
            }
        }
        System.out.println("data" + bArr);
        int i5 = width % 8;
        if (i5 != 0) {
            int i6 = height / 8;
            if (height % 8 != 0) {
                i6++;
            }
            int i7 = 8 - i5;
            byte b4 = 0;
            while (b4 < i6 * i7) {
                bArr[i] = 0;
                b4 = (byte) (b4 + 1);
                i++;
            }
        }
        return bArr;
    }
}
