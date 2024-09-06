const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const PDFDocument = require("pdfkit-table");
const { PassThrough } = require('stream'); 

const app = express();
app.use(cors());
app.use(express.json());

app.post('/send-email', async (req, res) => {
    const { arrayData, formValues1 } = req.body;

    if (!Array.isArray(arrayData) || typeof formValues1 !== 'object') {
        return res.status(400).send('Invalid request. Please provide a valid array.');
    }

    const nominatedVessel = formValues1.nominatedVessel || 'N/A';
    const intendedRotation = formValues1.intendedRotation || 'N/A';
    const carrierEntity = formValues1.carrierEntity || 'N/A';
    const emailSubject = `Subject Line: ${nominatedVessel}, Intended Rotation: ${intendedRotation}, Carrier Entity: ${carrierEntity}`;

    // Create PDF in memory using a PassThrough stream
    const doc = new PDFDocument();
    const pdfStream = new PassThrough();

    // Send PDF data directly to the stream
    doc.pipe(pdfStream);

    // Add content to the PDF
    doc.fontSize(16).text('Your Submitted Data', { align: 'center' });

    const tableData = {
        headers: ['Label', 'Value'],
        rows: arrayData.map(item => [item.label, item.value])
    };

    doc.table(tableData, {
        prepareHeader: () => doc.fontSize(12),
        prepareRow: (row, i) => doc.fontSize(10),
    });

    doc.end();

    // Collect PDF data in buffer to send via email
    let buffers = [];
    pdfStream.on('data', buffers.push.bind(buffers));
    pdfStream.on('end', async () => {
        let pdfBuffer = Buffer.concat(buffers);

        // Setup Nodemailer transport
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: "yousufkhalid855@gmail.com",
                pass: "fuce uvqx gwnn xstr",
            },
        });

        let mailOptions = {
            from: 'RECAPS@OCEAN7PROJECTS.COM',
            to: 'aq579733@gmail.com',
            subject: emailSubject,
            text: 'Please find the attached PDF document for your submitted data.',
            attachments: [
                {
                    filename: 'data.pdf',
                    content: pdfBuffer, // Send the PDF as a buffer
                    contentType: 'application/pdf',
                }
            ],
        };

        try {
            await transporter.sendMail(mailOptions);
            res.status(200).send('Email sent successfully with PDF attachment!');
        } catch (error) {
            console.error('Error sending email:', error);
            res.status(500).send('Failed to send email.');
        }
    });

    pdfStream.on('error', (error) => {
        console.error('Error generating PDF:', error);
        res.status(500).send('Failed to generate PDF.');
    });
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
