const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const PDFDocument = require("pdfkit-table");
const fs = require('fs');

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

    const doc = new PDFDocument(); 
    const filePath = `./output_${Date.now()}.pdf`;
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

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

    stream.on('finish', async () => {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: "yousufkhalid855@gmail.com",
                pass: "fuce uvqx gwnn xstr",
            },
        });

        let mailOptions = {
            from: process.env.USER_EMAIL,
            to: 'RECAPS@OCEAN7PROJECTS.COM',
            subject: emailSubject,
            text: 'Please find the attached PDF document for your submitted data.',
            attachments: [
                {
                    filename: 'data.pdf',
                    path: filePath,
                    contentType: 'application/pdf',
                }
            ],
        };

        try {
            await transporter.sendMail(mailOptions);
            res.status(200).send('Email sent successfully with PDF attachment!');

            fs.unlink(filePath, (err) => {
                if (err) console.error('Error deleting file:', err);
            });
        } catch (error) {
            console.error('Error sending email:', error);
            res.status(500).send('Failed to send email.');
        }
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});