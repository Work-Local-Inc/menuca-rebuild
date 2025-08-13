package com.cojotech.commission.menu.printer;

import androidx.core.view.MotionEventCompat;
import com.cojotech.commission.menu.restotool.BuildConfig;
import java.io.UnsupportedEncodingException;

/* loaded from: classes.dex */
public class PrinterCommand {
    public static byte[] POS_Set_PrtInit() {
        return Utility.byteArraysToBytes(new byte[][]{Command.ESC_Init});
    }

    public static byte[] POS_Set_LF() {
        return Utility.byteArraysToBytes(new byte[][]{Command.LF});
    }

    public static byte[] POS_Set_PrtAndFeedPaper(int i) {
        if ((i > 255) || (i < 0)) {
            return null;
        }
        Command.ESC_J[2] = (byte) i;
        return Utility.byteArraysToBytes(new byte[][]{Command.ESC_J});
    }

    public static byte[] POS_Set_PrtSelfTest() {
        return Utility.byteArraysToBytes(new byte[][]{Command.US_vt_eot});
    }

    public static byte[] POS_Set_Beep(int i, int i2) {
        if ((i2 < 1 || i2 > 9) || (i < 1 || i > 9)) {
            return null;
        }
        Command.ESC_B_m_n[2] = (byte) i;
        Command.ESC_B_m_n[3] = (byte) i2;
        return Utility.byteArraysToBytes(new byte[][]{Command.ESC_B_m_n});
    }

    public static byte[] POS_Set_Cut(int i) {
        if ((i > 255) || (i < 0)) {
            return null;
        }
        Command.GS_V_m_n[3] = (byte) i;
        return Utility.byteArraysToBytes(new byte[][]{Command.GS_V_m_n});
    }

    public static byte[] POS_Set_Cashbox(int i, int i2, int i3) {
        if (((i < 0 || i > 1) | (i2 < 0) | (i2 > 255) | (i3 < 0)) || (i3 > 255)) {
            return null;
        }
        Command.ESC_p[2] = (byte) i;
        Command.ESC_p[3] = (byte) i2;
        Command.ESC_p[4] = (byte) i3;
        return Utility.byteArraysToBytes(new byte[][]{Command.ESC_p});
    }

    public static byte[] POS_Set_Absolute(int i) {
        if ((i > 65535) || (i < 0)) {
            return null;
        }
        Command.ESC_Relative[2] = (byte) (i % 256);
        Command.ESC_Relative[3] = (byte) (i / 256);
        return Utility.byteArraysToBytes(new byte[][]{Command.ESC_Relative});
    }

    public static byte[] POS_Set_Relative(int i) {
        if ((i < 0) || (i > 65535)) {
            return null;
        }
        Command.ESC_Absolute[2] = (byte) (i % 256);
        Command.ESC_Absolute[3] = (byte) (i / 256);
        return Utility.byteArraysToBytes(new byte[][]{Command.ESC_Absolute});
    }

    public static byte[] POS_Set_LeftSP(int i) {
        if ((i > 255) || (i < 0)) {
            return null;
        }
        Command.GS_LeftSp[2] = (byte) (i % 100);
        Command.GS_LeftSp[3] = (byte) (i / 100);
        return Utility.byteArraysToBytes(new byte[][]{Command.GS_LeftSp});
    }

    public static byte[] POS_S_Align(int i) {
        if ((i < 48 || i > 50) || (i < 0 || i > 2)) {
            return null;
        }
        byte[] bArr = Command.ESC_Align;
        bArr[2] = (byte) i;
        return bArr;
    }

    public static byte[] POS_Set_PrintWidth(int i) {
        if ((i < 0) || (i > 255)) {
            return null;
        }
        Command.GS_W[2] = (byte) (i % 100);
        Command.GS_W[3] = (byte) (i / 100);
        return Utility.byteArraysToBytes(new byte[][]{Command.GS_W});
    }

    public static byte[] POS_Set_DefLineSpace() {
        return Command.ESC_Two;
    }

    public static byte[] POS_Set_LineSpace(int i) {
        if ((i < 0) || (i > 255)) {
            return null;
        }
        Command.ESC_Three[2] = (byte) i;
        return Utility.byteArraysToBytes(new byte[][]{Command.ESC_Three});
    }

    public static byte[] POS_Set_CodePage(int i) {
        if (i > 255) {
            return null;
        }
        Command.ESC_t[2] = (byte) i;
        return Utility.byteArraysToBytes(new byte[][]{Command.ESC_t});
    }

    public static byte[] POS_Print_Text(String str, String str2, int i, int i2, int i3, int i4) throws UnsupportedEncodingException {
        if (i < 0 || i > 255 || str == null || BuildConfig.FLAVOR.equals(str) || str.length() < 1) {
            return null;
        }
        byte[] bytes = str.getBytes(str2);
        Command.GS_ExclamationMark[2] = (byte) (new byte[]{0, Command.DLE, Command.SP, 48}[i2] + new byte[]{0, 1, 2, 3}[i3]);
        Command.ESC_t[2] = (byte) i;
        Command.ESC_M[2] = (byte) i4;
        return i == 0 ? Utility.byteArraysToBytes(new byte[][]{Command.GS_ExclamationMark, Command.ESC_t, Command.FS_and, Command.ESC_M, bytes}) : Utility.byteArraysToBytes(new byte[][]{Command.GS_ExclamationMark, Command.ESC_t, Command.FS_dot, Command.ESC_M, bytes});
    }

    public static byte[] POS_Set_Bold(int i) {
        byte b = (byte) i;
        Command.ESC_E[2] = b;
        Command.ESC_G[2] = b;
        return Utility.byteArraysToBytes(new byte[][]{Command.ESC_E, Command.ESC_G});
    }

    public static byte[] POS_Set_LeftBrace(int i) {
        Command.ESC_LeftBrace[2] = (byte) i;
        return Utility.byteArraysToBytes(new byte[][]{Command.ESC_LeftBrace});
    }

    public static byte[] POS_Set_UnderLine(int i) {
        if (i < 0 || i > 2) {
            return null;
        }
        byte b = (byte) i;
        Command.ESC_Minus[2] = b;
        Command.FS_Minus[2] = b;
        return Utility.byteArraysToBytes(new byte[][]{Command.ESC_Minus, Command.FS_Minus});
    }

    public static byte[] POS_Set_FontSize(int i, int i2) {
        if (((i < 0) | (i > 7) | (i2 < 0)) || (i2 > 7)) {
            return null;
        }
        Command.GS_ExclamationMark[2] = (byte) (new byte[]{0, Command.DLE, Command.SP, 48, 64, 80, 96, 112}[i] + new byte[]{0, 1, 2, 3, 4, 5, 6, 7}[i2]);
        return Utility.byteArraysToBytes(new byte[][]{Command.GS_ExclamationMark});
    }

    public static byte[] POS_Set_Inverse(int i) {
        Command.GS_B[2] = (byte) i;
        return Utility.byteArraysToBytes(new byte[][]{Command.GS_B});
    }

    public static byte[] POS_Set_Rotate(int i) {
        if (i < 0 || i > 1) {
            return null;
        }
        Command.ESC_V[2] = (byte) i;
        return Utility.byteArraysToBytes(new byte[][]{Command.ESC_V});
    }

    public static byte[] POS_Set_ChoseFont(int i) {
        if ((i > 1) || (i < 0)) {
            return null;
        }
        Command.ESC_M[2] = (byte) i;
        return Utility.byteArraysToBytes(new byte[][]{Command.ESC_M});
    }

    public static byte[] getBarCommand(String str, int i, int i2, int i3) throws UnsupportedEncodingException {
        if (((i < 0) | (i > 19) | (i2 < 0) | (i2 > 3) | (i3 < 1)) || (i3 > 8)) {
            return null;
        }
        try {
            byte[] bytes = str.getBytes("GBK");
            byte[] bArr = new byte[bytes.length + 7];
            bArr[0] = Command.ESC;
            bArr[1] = 90;
            bArr[2] = (byte) i;
            bArr[3] = (byte) i2;
            bArr[4] = (byte) i3;
            bArr[5] = (byte) (bytes.length & 255);
            bArr[6] = (byte) ((bytes.length & MotionEventCompat.ACTION_POINTER_INDEX_MASK) >> 8);
            System.arraycopy(bytes, 0, bArr, 7, bytes.length);
            return bArr;
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            return null;
        }
    }

    public static byte[] getCodeBarCommand(String str, int i, int i2, int i3, int i4, int i5) throws UnsupportedEncodingException {
        if (((i < 65) | (i > 73) | (i2 < 2) | (i2 > 6) | (i3 < 1) | (i3 > 255)) || (str.length() == 0)) {
            return null;
        }
        try {
            byte[] bytes = str.getBytes("GBK");
            byte[] bArr = new byte[bytes.length + 16];
            bArr[0] = Command.GS;
            bArr[1] = 119;
            bArr[2] = (byte) i2;
            bArr[3] = Command.GS;
            bArr[4] = 104;
            bArr[5] = (byte) i3;
            bArr[6] = Command.GS;
            bArr[7] = 102;
            bArr[8] = (byte) (i4 & 1);
            bArr[9] = Command.GS;
            bArr[10] = 72;
            bArr[11] = (byte) (3 & i5);
            bArr[12] = Command.GS;
            bArr[13] = 107;
            bArr[14] = (byte) i;
            bArr[15] = (byte) bytes.length;
            System.arraycopy(bytes, 0, bArr, 16, bytes.length);
            return bArr;
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            return null;
        }
    }

    public static byte[] POS_Set_Font(String str, int i, int i2, int i3, int i4) throws UnsupportedEncodingException {
        if (((str.length() == 0) | (i3 < 0) | (i3 > 4) | (i4 < 0) | (i4 > 4) | (i2 < 0)) || (i2 > 1)) {
            return null;
        }
        try {
            byte[] bytes = str.getBytes("GBK");
            byte[] bArr = new byte[bytes.length + 9];
            byte[] bArr2 = {0, Command.DLE, Command.SP, 48};
            bArr[0] = Command.ESC;
            bArr[1] = 69;
            bArr[2] = (byte) i;
            bArr[3] = Command.ESC;
            bArr[4] = 77;
            bArr[5] = (byte) i2;
            bArr[6] = Command.GS;
            bArr[7] = 33;
            bArr[8] = (byte) (bArr2[i3] + new byte[]{0, 1, 2, 3}[i4]);
            System.arraycopy(bytes, 0, bArr, 9, bytes.length);
            return bArr;
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
            return null;
        }
    }
}
