package com.cojotech.commission.menu.printer;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.ColorMatrix;
import android.graphics.ColorMatrixColorFilter;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.os.Environment;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.text.TextUtils;
import androidx.core.view.ViewCompat;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;

/* loaded from: classes.dex */
public class Utility {
    private static final int WIDTH_58 = 384;
    private static final int WIDTH_80 = 576;
    public byte[] buf;
    public int index = 0;
    private static int[] p0 = {0, 128};
    private static int[] p1 = {0, 64};
    private static int[] p2 = {0, 32};
    private static int[] p3 = {0, 16};
    private static int[] p4 = {0, 8};
    private static int[] p5 = {0, 4};
    private static int[] p6 = {0, 2};
    private static final byte[] chartobyte = {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 0, 0, 0, 0, 0, 0, 10, 11, Command.FF, 13, 14, 15};

    public static boolean IsHexChar(char c) {
        return (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
    }

    public Utility(int i) {
        this.buf = new byte[i];
    }

    public static StringBuilder RemoveChar(String str, char c) {
        StringBuilder sb = new StringBuilder();
        int length = str.length();
        for (int i = 0; i < length; i++) {
            char cCharAt = str.charAt(i);
            if (cCharAt != c) {
                sb.append(cCharAt);
            }
        }
        return sb;
    }

    public static byte HexCharsToByte(char c, char c2) {
        byte[] bArr = chartobyte;
        return (byte) (((bArr[c - '0'] << 4) & 240) | (bArr[c2 - '0'] & 15));
    }

    public static byte[] HexStringToBytes(String str) {
        int length = str.length();
        if (length % 2 != 0) {
            return null;
        }
        byte[] bArr = new byte[length / 2];
        for (int i = 0; i < length; i += 2) {
            char cCharAt = str.charAt(i);
            char cCharAt2 = str.charAt(i + 1);
            if (!IsHexChar(cCharAt) || !IsHexChar(cCharAt2)) {
                return null;
            }
            if (cCharAt >= 'a') {
                cCharAt = (char) (cCharAt - ' ');
            }
            if (cCharAt2 >= 'a') {
                cCharAt2 = (char) (cCharAt2 - ' ');
            }
            bArr[i / 2] = HexCharsToByte(cCharAt, cCharAt2);
        }
        return bArr;
    }

    public void UTF8ToGBK(String str) throws UnsupportedEncodingException {
        try {
            for (byte b : str.getBytes("GBK")) {
                byte[] bArr = this.buf;
                int i = this.index;
                this.index = i + 1;
                bArr[i] = b;
            }
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
    }

    public static byte[] StringTOGBK(String str) {
        try {
            return str.getBytes("GBK");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            return null;
        }
    }

    public static Bitmap createAppIconText(Bitmap bitmap, String str, float f, boolean z, int i) {
        if (z) {
            Bitmap bitmapCreateBitmap = Bitmap.createBitmap(384, i, Bitmap.Config.ARGB_8888);
            int width = bitmapCreateBitmap.getWidth();
            Canvas canvas = new Canvas(bitmapCreateBitmap);
            canvas.setBitmap(bitmapCreateBitmap);
            canvas.drawColor(-1);
            TextPaint textPaint = new TextPaint();
            textPaint.setColor(ViewCompat.MEASURED_STATE_MASK);
            textPaint.setTextSize(f);
            textPaint.setAntiAlias(true);
            textPaint.setStyle(Paint.Style.FILL);
            textPaint.setFakeBoldText(false);
            StaticLayout staticLayout = new StaticLayout(str, 0, str.length(), textPaint, width, Layout.Alignment.ALIGN_NORMAL, 1.1f, 0.0f, true, TextUtils.TruncateAt.END, width);
            canvas.translate(0.0f, 5.0f);
            staticLayout.draw(canvas);
            canvas.save();
            canvas.restore();
            return bitmapCreateBitmap;
        }
        Bitmap bitmapCreateBitmap2 = Bitmap.createBitmap(WIDTH_80, i, Bitmap.Config.ARGB_8888);
        int width2 = bitmapCreateBitmap2.getWidth();
        Canvas canvas2 = new Canvas(bitmapCreateBitmap2);
        canvas2.setBitmap(bitmapCreateBitmap2);
        canvas2.drawColor(-1);
        TextPaint textPaint2 = new TextPaint();
        textPaint2.setColor(ViewCompat.MEASURED_STATE_MASK);
        textPaint2.setTextSize(f);
        textPaint2.setAntiAlias(true);
        textPaint2.setStyle(Paint.Style.FILL);
        textPaint2.setFakeBoldText(false);
        StaticLayout staticLayout2 = new StaticLayout(str, 0, str.length(), textPaint2, width2, Layout.Alignment.ALIGN_NORMAL, 1.1f, 0.0f, true, TextUtils.TruncateAt.END, width2);
        canvas2.translate(0.0f, 5.0f);
        staticLayout2.draw(canvas2);
        canvas2.save();
        canvas2.restore();
        return bitmapCreateBitmap2;
    }

    public static byte[] byteArraysToBytes(byte[][] bArr) {
        int length = 0;
        for (byte[] bArr2 : bArr) {
            length += bArr2.length;
        }
        byte[] bArr3 = new byte[length];
        int i = 0;
        int i2 = 0;
        while (i < bArr.length) {
            int i3 = i2;
            int i4 = 0;
            while (i4 < bArr[i].length) {
                bArr3[i3] = bArr[i][i4];
                i4++;
                i3++;
            }
            i++;
            i2 = i3;
        }
        return bArr3;
    }

    public static Bitmap resizeImage(Bitmap bitmap, int i, int i2) {
        int width = bitmap.getWidth();
        int height = bitmap.getHeight();
        Matrix matrix = new Matrix();
        matrix.postScale(i / width, i2 / height);
        return Bitmap.createBitmap(bitmap, 0, 0, width, height, matrix, true);
    }

    public static Bitmap toGrayscale(Bitmap bitmap) {
        Bitmap bitmapCreateBitmap = Bitmap.createBitmap(bitmap.getWidth(), bitmap.getHeight(), Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmapCreateBitmap);
        Paint paint = new Paint();
        ColorMatrix colorMatrix = new ColorMatrix();
        colorMatrix.setSaturation(0.0f);
        paint.setColorFilter(new ColorMatrixColorFilter(colorMatrix));
        canvas.drawBitmap(bitmap, 0.0f, 0.0f, paint);
        return bitmapCreateBitmap;
    }

    public static void saveMyBitmap(Bitmap bitmap, String str) throws IOException {
        File file = new File(Environment.getExternalStorageDirectory().getPath(), str);
        try {
            file.createNewFile();
        } catch (IOException unused) {
        }
        try {
            FileOutputStream fileOutputStream = new FileOutputStream(file);
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, fileOutputStream);
            fileOutputStream.flush();
            fileOutputStream.close();
        } catch (FileNotFoundException | IOException unused2) {
        }
    }

    public static byte[] thresholdToBWPic(Bitmap bitmap) {
        int[] iArr = new int[bitmap.getWidth() * bitmap.getHeight()];
        byte[] bArr = new byte[bitmap.getWidth() * bitmap.getHeight()];
        bitmap.getPixels(iArr, 0, bitmap.getWidth(), 0, 0, bitmap.getWidth(), bitmap.getHeight());
        format_K_threshold(iArr, bitmap.getWidth(), bitmap.getHeight(), bArr);
        return bArr;
    }

    private static void format_K_threshold(int[] iArr, int i, int i2, byte[] bArr) {
        int i3 = 0;
        int i4 = 0;
        int i5 = 0;
        while (i3 < i2) {
            int i6 = i5;
            int i7 = i4;
            for (int i8 = 0; i8 < i; i8++) {
                i7 += iArr[i6] & 255;
                i6++;
            }
            i3++;
            i4 = i7;
            i5 = i6;
        }
        int i9 = (i4 / i2) / i;
        int i10 = 0;
        int i11 = 0;
        while (i10 < i2) {
            int i12 = i11;
            for (int i13 = 0; i13 < i; i13++) {
                if ((iArr[i12] & 255) > i9) {
                    bArr[i12] = 0;
                } else {
                    bArr[i12] = 1;
                }
                i12++;
            }
            i10++;
            i11 = i12;
        }
    }

    public static void overWriteBitmap(Bitmap bitmap, byte[] bArr) {
        int height = bitmap.getHeight();
        int width = bitmap.getWidth();
        int i = 0;
        int i2 = 0;
        while (i < height) {
            int i3 = i2;
            for (int i4 = 0; i4 < width; i4++) {
                if (bArr[i3] == 0) {
                    bitmap.setPixel(i4, i, -1);
                } else {
                    bitmap.setPixel(i4, i, ViewCompat.MEASURED_STATE_MASK);
                }
                i3++;
            }
            i++;
            i2 = i3;
        }
    }

    public static byte[] eachLinePixToCmd(byte[] bArr, int i, int i2) {
        int length = bArr.length / i;
        int i3 = i / 8;
        int i4 = i3 + 8;
        byte[] bArr2 = new byte[length * i4];
        int i5 = 0;
        int i6 = 0;
        while (i5 < length) {
            int i7 = i5 * i4;
            bArr2[i7 + 0] = Command.GS;
            bArr2[i7 + 1] = 118;
            bArr2[i7 + 2] = 48;
            bArr2[i7 + 3] = (byte) (i2 & 1);
            bArr2[i7 + 4] = (byte) (i3 % 256);
            bArr2[i7 + 5] = (byte) (i3 / 256);
            bArr2[i7 + 6] = 1;
            bArr2[i7 + 7] = 0;
            int i8 = i6;
            for (int i9 = 0; i9 < i3; i9++) {
                bArr2[i7 + 8 + i9] = (byte) (p0[bArr[i8]] + p1[bArr[i8 + 1]] + p2[bArr[i8 + 2]] + p3[bArr[i8 + 3]] + p4[bArr[i8 + 4]] + p5[bArr[i8 + 5]] + p6[bArr[i8 + 6]] + bArr[i8 + 7]);
                i8 += 8;
            }
            i5++;
            i6 = i8;
        }
        return bArr2;
    }
}
