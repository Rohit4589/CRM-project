Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;

public class DarkLogoGenerator {
    public static void GenerateForDarkBg(string srcPath, string dstPath) {
        using (Bitmap src = new Bitmap(srcPath)) {
            Bitmap dst = new Bitmap(src.Width, src.Height, PixelFormat.Format32bppArgb);
            
            for (int y = 0; y < src.Height; y++) {
                for (int x = 0; x < src.Width; x++) {
                    Color c = src.GetPixel(x, y);
                    
                    int minChan = Math.Min(c.R, Math.Min(c.G, c.B));
                    int maxChan = Math.Max(c.R, Math.Max(c.G, c.B));
                    int diff = maxChan - minChan;

                    // If bright white/near-white background
                    if (minChan >= 240 && diff <= 15) {
                        dst.SetPixel(x, y, Color.FromArgb(0, 0, 0, 0));
                    } else if (minChan >= 215 && diff <= 15) {
                        // Smooth edge
                        double t = (minChan - 215.0) / (240.0 - 215.0);
                        int alpha = (int)Math.Max(0, Math.Min(255, (1.0 - t) * 255));
                        dst.SetPixel(x, y, Color.FromArgb(alpha, c.R, c.G, c.B));
                    } else {
                        // Check if pixel is dark charcoal / black ("BEYOND IMAGINATION" & arrows)
                        // In the logo, "BEYOND IMAGINATION" has low R, G, B with low saturation (diff <= 35 and maxChan < 90)
                        if (maxChan < 95 && diff <= 35) {
                            // Turn to crisp off-white for dark background visibility
                            dst.SetPixel(x, y, Color.FromArgb(255, 243, 244, 246));
                        } else {
                            // Gold / Bronze text "MODERN INTERIOR"
                            // Keep the exact signature gold, with rich vibrance
                            dst.SetPixel(x, y, Color.FromArgb(255, c.R, c.G, c.B));
                        }
                    }
                }
            }
            dst.Save(dstPath, ImageFormat.Png);
            dst.Dispose();
        }
    }
}
"@ -ReferencedAssemblies "System.Drawing"

[DarkLogoGenerator]::GenerateForDarkBg("c:\Users\Annie\Downloads\Mordern Interior Project\CRM-project\logo.jpg", "c:\Users\Annie\Downloads\Mordern Interior Project\CRM-project\logo-dark-sidebar.png")
[DarkLogoGenerator]::GenerateForDarkBg("c:\Users\Annie\Downloads\Mordern Interior Project\CRM-project\logo.jpg", "c:\Users\Annie\Downloads\Mordern Interior Project\CRM-project\frontend\public\logo-dark-sidebar.png")
[DarkLogoGenerator]::GenerateForDarkBg("c:\Users\Annie\Downloads\Mordern Interior Project\CRM-project\logo.jpg", "c:\Users\Annie\Downloads\Mordern Interior Project\CRM-project\frontend\src\assets\logo-dark-sidebar.png")
Write-Host "Dark sidebar logo generated successfully!"
