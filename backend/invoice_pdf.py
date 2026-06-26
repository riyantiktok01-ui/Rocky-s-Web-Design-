from reportlab.lib.pagesizes import LETTER
from reportlab.pdfgen import canvas
from io import BytesIO
import datetime

def generate_invoice_pdf(invoice, client, project):
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=LETTER)
    width, height = LETTER

    # Header
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, height - 50, "Rocky's Web Design")
    
    p.setFont("Helvetica", 10)
    p.drawString(50, height - 70, "Professional Websites for Local Businesses")
    
    p.setFont("Helvetica-Bold", 20)
    p.drawRightString(width - 50, height - 50, "INVOICE")
    
    p.setFont("Helvetica", 10)
    p.drawRightString(width - 50, height - 70, f"Invoice #: {invoice.invoice_number}")
    p.drawRightString(width - 50, height - 85, f"Date: {invoice.created_at.strftime('%Y-%m-%d')}")

    # Bill To
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, height - 120, "BILL TO:")
    p.setFont("Helvetica", 10)
    p.drawString(50, height - 135, client.business_name)
    p.drawString(50, height - 150, client.owner_name)
    p.drawString(50, height - 165, client.email)
    p.drawString(50, height - 180, client.phone)

    # Project
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, height - 210, f"Project: {project.name}")

    # Items Table Header
    p.line(50, height - 230, width - 50, height - 230)
    p.setFont("Helvetica-Bold", 10)
    p.drawString(60, height - 245, "Description")
    p.drawRightString(width - 60, height - 245, "Amount")
    p.line(50, height - 255, width - 50, height - 255)

    # Items
    y = height - 275
    p.setFont("Helvetica", 10)
    for item in invoice.line_items:
        p.drawString(60, y, item.get("description", "Service"))
        p.drawRightString(width - 60, y, f"${item.get('amount', 0):.2f}")
        y -= 20

    # Totals
    p.line(50, y, width - 50, y)
    y -= 20
    p.drawString(width - 200, y, "Subtotal:")
    p.drawRightString(width - 60, y, f"${invoice.subtotal:.2f}")
    y -= 20
    p.drawString(width - 200, y, "Tax:")
    p.drawRightString(width - 60, y, f"${invoice.tax:.2f}")
    y -= 20
    p.setFont("Helvetica-Bold", 12)
    p.drawString(width - 200, y, "Total:")
    p.drawRightString(width - 60, y, f"${invoice.total:.2f}")

    # Footer
    p.setFont("Helvetica-Oblique", 8)
    p.drawCentredString(width / 2, 50, "Thank you for your business!")

    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer
