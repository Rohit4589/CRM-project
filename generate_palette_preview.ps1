Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public class PalettePreviewGenerator {
    public static void GeneratePreview(string darkLogoPath, string lightLogoPath, string outputPath) {
        int width = 1200;
        int height = 800;
        
        using (Bitmap bmp = new Bitmap(width, height))
        using (Graphics g = Graphics.FromImage(bmp)) {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAliasGridFit;
            g.Clear(Color.FromArgb(245, 246, 248));

            // Title Header
            using (Font titleFont = new Font("Segoe UI", 22, FontStyle.Bold))
            using (Font subFont = new Font("Segoe UI", 12, FontStyle.Regular))
            using (Brush darkBrush = new SolidBrush(Color.FromArgb(17, 24, 39)))
            using (Brush grayBrush = new SolidBrush(Color.FromArgb(107, 114, 128))) {
                g.DrawString("Modern Interior — Sidebar Color Palette Choices", titleFont, darkBrush, 40, 25);
                g.DrawString("Compare how the transparent logo looks on each of the 10 curated luxury shades below:", subFont, grayBrush, 40, 65);
            }

            var shades = new[] {
                new { Num = 1, Name = "Charcoal Obsidian", Hex = "#18181B", R = 24, G = 24, B = 27, IsDark = true, Desc = "Warm mineral stone, zero blue" },
                new { Num = 2, Name = "Espresso Wood", Hex = "#1F1610", R = 31, G = 22, B = 16, IsDark = true, Desc = "Smoked mahogany woodwork tone" },
                new { Num = 3, Name = "Muted Slate Graphite", Hex = "#242832", R = 36, G = 40, B = 50, IsDark = true, Desc = "Architectural matte charcoal slate" },
                new { Num = 4, Name = "Deep Forest Emerald", Hex = "#0E1E17", R = 14, G = 30, B = 23, IsDark = true, Desc = "British racing pine green" },
                new { Num = 5, Name = "Smoky Aubergine Plum", Hex = "#1E131C", R = 30, G = 19, B = 28, IsDark = true, Desc = "Velvety dark plum boutique tone" },
                new { Num = 6, Name = "Midnight Onyx", Hex = "#121212", R = 18, G = 18, B = 18, IsDark = true, Desc = "Pure gallery deep black" },
                new { Num = 7, Name = "Warm Cashmere Greige", Hex = "#E6DFD5", R = 230, G = 223, B = 213, IsDark = false, Desc = "Architectural luxury warm greige" },
                new { Num = 8, Name = "Alabaster Sandstone", Hex = "#F3EDE6", R = 243, G = 237, B = 230, IsDark = false, Desc = "Warm creamy sandstone interior" },
                new { Num = 9, Name = "Desert Clay Sand", Hex = "#D4C7B5", R = 212, G = 199, B = 181, IsDark = false, Desc = "Organic earthy sand neutral" },
                new { Num = 10, Name = "Brushed Concrete Gray", Hex = "#E2E5E9", R = 226, G = 229, B = 233, IsDark = false, Desc = "Cool matte architectural concrete" }
            };

            using (Image darkLogo = Image.FromFile(darkLogoPath))
            using (Image lightLogo = Image.FromFile(lightLogoPath))
            using (Font cardTitleFont = new Font("Segoe UI", 12, FontStyle.Bold))
            using (Font hexFont = new Font("Segoe UI", 10, FontStyle.Bold))
            using (Font descFont = new Font("Segoe UI", 9, FontStyle.Regular)) {
                
                int startX = 40;
                int startY = 110;
                int cardW = 210;
                int cardH = 310;
                int gapX = 20;
                int gapY = 20;

                for (int i = 0; i < shades.Length; i++) {
                    var s = shades[i];
                    int col = i % 5;
                    int row = i / 5;
                    int x = startX + col * (cardW + gapX);
                    int y = startY + row * (cardH + gapY);

                    // Card background
                    Color cardBg = Color.FromArgb(s.R, s.G, s.B);
                    using (Brush bgBrush = new SolidBrush(cardBg))
                    using (Pen borderPen = new Pen(Color.FromArgb(s.IsDark ? 60 : 200, s.IsDark ? 255 : 0, s.IsDark ? 255 : 0, s.IsDark ? 255 : 0), 1)) {
                        
                        // Fill card
                        GraphicsPath path = new GraphicsPath();
                        int r = 12;
                        path.AddArc(x, y, r, r, 180, 90);
                        path.AddArc(x + cardW - r, y, r, r, 270, 90);
                        path.AddArc(x + cardW - r, y + cardH - r, r, r, 0, 90);
                        path.AddArc(x, y + cardH - r, r, r, 90, 90);
                        path.CloseFigure();

                        g.FillPath(bgBrush, path);
                        g.DrawPath(borderPen, path);
                    }

                    // Logo preview area inside card
                    Image logoToDraw = s.IsDark ? darkLogo : lightLogo;
                    int logoAreaY = y + 20;
                    int logoW = cardW - 30;
                    int logoH = (int)((double)darkLogo.Height / darkLogo.Width * logoW);
                    int logoX = x + 15;
                    g.DrawImage(logoToDraw, logoX, logoAreaY, logoW, logoH);

                    // Divider line
                    int divY = logoAreaY + logoH + 20;
                    using (Pen divPen = new Pen(Color.FromArgb(s.IsDark ? 40 : 180, s.IsDark ? 255 : 0, s.IsDark ? 255 : 0, s.IsDark ? 255 : 0), 1)) {
                        g.DrawLine(divPen, x + 15, divY, x + cardW - 15, divY);
                    }

                    // Text Info
                    Color textColor = s.IsDark ? Color.FromArgb(245, 245, 245) : Color.FromArgb(30, 30, 30);
                    Color subTextColor = s.IsDark ? Color.FromArgb(180, 180, 180) : Color.FromArgb(90, 90, 90);
                    Color accentColor = Color.FromArgb(165, 106, 48);

                    using (Brush textBrush = new SolidBrush(textColor))
                    using (Brush subBrush = new SolidBrush(subTextColor))
                    using (Brush accBrush = new SolidBrush(accentColor)) {
                        g.DrawString(s.Num + ". " + s.Name, cardTitleFont, textBrush, x + 12, divY + 12);
                        g.DrawString(s.Hex, hexFont, accBrush, x + 12, divY + 36);
                        
                        RectangleF descRect = new RectangleF(x + 12, divY + 58, cardW - 24, 45);
                        g.DrawString(s.Desc, descFont, subBrush, descRect);
                    }
                }
            }

            bmp.Save(outputPath, ImageFormat.Png);
        }
    }
}
"@ -ReferencedAssemblies "System.Drawing"

$darkLogo = "c:\Users\Annie\Downloads\Mordern Interior Project\CRM-project\logo-dark-sidebar.png"
$lightLogo = "c:\Users\Annie\Downloads\Mordern Interior Project\CRM-project\logo.png"
$output = "c:\Users\Annie\Downloads\Mordern Interior Project\CRM-project\palette_preview.png"

[PalettePreviewGenerator]::GeneratePreview($darkLogo, $lightLogo, $output)
Write-Host "Palette preview image generated successfully at $output"
