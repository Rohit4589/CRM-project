Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;

public class LogoConverter {
    public static void MakeTransparent(string srcPath, string dstPath) {
        using (Bitmap src = new Bitmap(srcPath)) {
            Bitmap dst = new Bitmap(src.Width, src.Height, PixelFormat.Format32bppArgb);
            
            for (int y = 0; y < src.Height; y++) {
                for (int x = 0; x < src.Width; x++) {
                    Color c = src.GetPixel(x, y);
                    
                    // Check brightness / whiteness
                    // The logo background is very close to (250, 249, 246)
                    int minChan = Math.Min(c.R, Math.Min(c.G, c.B));
                    int maxChan = Math.Max(c.R, Math.Max(c.G, c.B));
                    int diff = maxChan - minChan;

                    // If it's grayish/white and bright
                    if (minChan >= 242 && diff <= 12) {
                        dst.SetPixel(x, y, Color.FromArgb(0, 0, 0, 0));
                    } else if (minChan >= 215 && diff <= 15) {
                        // Anti-aliased transition edge
                        double t = (minChan - 215.0) / (242.0 - 215.0);
                        int alpha = (int)Math.Max(0, Math.Min(255, (1.0 - t) * 255));
                        dst.SetPixel(x, y, Color.FromArgb(alpha, c.R, c.G, c.B));
                    } else {
                        dst.SetPixel(x, y, Color.FromArgb(255, c.R, c.G, c.B));
                    }
                }
            }
            dst.Save(dstPath, ImageFormat.Png);
            dst.Dispose();
        }
    }
}
"@ -ReferencedAssemblies "System.Drawing"

[LogoConverter]::MakeTransparent("c:\Users\Annie\Downloads\Mordern Interior Project\CRM-project\logo.jpg", "c:\Users\Annie\Downloads\Mordern Interior Project\CRM-project\logo.png")
[LogoConverter]::MakeTransparent("c:\Users\Annie\Downloads\Mordern Interior Project\CRM-project\logo.jpg", "c:\Users\Annie\Downloads\Mordern Interior Project\CRM-project\frontend\public\logo.png")
[LogoConverter]::MakeTransparent("c:\Users\Annie\Downloads\Mordern Interior Project\CRM-project\logo.jpg", "c:\Users\Annie\Downloads\Mordern Interior Project\CRM-project\frontend\src\assets\logo.png")
Write-Host "Logo conversion complete!"
