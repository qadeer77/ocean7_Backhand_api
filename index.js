// const express = require('express');
// const nodemailer = require('nodemailer');
// const cors = require('cors');
// const PDFDocument = require("pdfkit-table");
// const { PassThrough } = require('stream');

// const app = express();
// app.use(cors());
// app.use(express.json());

// app.post('/send-email', async (req, res) => {
//     const { arrayData, formValues1 } = req.body;

//     console.log("arrayData=====>>>>>> ", arrayData);


//     if (!Array.isArray(arrayData) || typeof formValues1 !== 'object') {
//         return res.status(400).send('Invalid request. Please provide a valid array.');
//     }

//     const nominatedVessel = formValues1.nominatedVessel || 'N/A';
//     const intendedRotation = formValues1.intendedRotation || 'N/A';
//     const carrierEntity = formValues1.carrierEntity || 'N/A';
//     const emailSubject = `Subject Line: ${nominatedVessel}, Intended Rotation: ${intendedRotation}, Carrier Entity: ${carrierEntity}`;

//     const doc = new PDFDocument();
//     const pdfStream = new PassThrough();

//     doc.pipe(pdfStream);

//     doc.fontSize(16).text('Your Submitted Data', { align: 'center' });

//     const tableData = {
//         headers: ['Label', 'Value'],
//         rows: arrayData.map(item => [item.label, item.value])
//     };

//     doc.table(tableData, {
//         prepareHeader: () => doc.fontSize(12),
//         prepareRow: (row, i) => doc.fontSize(10),
//     });

//     doc.end();

//     let buffers = [];
//     pdfStream.on('data', buffers.push.bind(buffers));
//     pdfStream.on('end', async () => {
//         let pdfBuffer = Buffer.concat(buffers);

//         let transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 // user: "yousufkhalid855@gmail.com",
//                 // pass: "fuce uvqx gwnn xstr",
//                 user: "preetkumar1970@gmail.com",
//                 pass: "qgun ookb ndqh dwbn",
//             },
//         });

//         let mailOptions = {
//             from: 'aq579733@gmail.com',
//             to: 'aq579733@gmail.com',
//             subject: emailSubject,
//             text: 'Please find the attached PDF document for your submitted data.',
//             attachments: [
//                 {
//                     filename: 'data.pdf',
//                     content: pdfBuffer,
//                     contentType: 'application/pdf',
//                 }
//             ],
//         };

//         try {
//             await transporter.sendMail(mailOptions);
//             res.status(200).send('Email sent successfully with PDF attachment!');
//         } catch (error) {
//             console.error('Error sending email:', error);
//             res.status(500).send('Failed to send email.');
//         }
//     });

//     pdfStream.on('error', (error) => {
//         console.error('Error generating PDF:', error);
//         res.status(500).send('Failed to generate PDF.');
//     });
// });

// const PORT = 5000;

// app.listen(PORT, () => {
//     console.log(`Server is running on ${PORT}`);
// });


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
    const doc = new PDFDocument();
    const pdfStream = new PassThrough();
    doc.pipe(pdfStream);
    doc.fontSize(16).text('Your Submitted Data', { align: 'center' });
    const tableData = {
        headers: ['Label', 'Value'],
        rows: arrayData.filter(item => !item.rating).map(item => [item.label, item.value])
    };
    doc.fontSize(12).text('General Data');
    doc.table(tableData, {
        prepareHeader: () => doc.fontSize(12),
        prepareRow: (row, i) => doc.fontSize(10),
    });
    const ratingTableData = {
        headers: ['Label', 'Rating', 'Comment'],
        rows: arrayData.filter(item => item.rating).map(item => [item.label, item.rating, item.comment || 'No Comment'])
    };
    doc.fontSize(16).text('Ratings and Comments', { align: 'center' });
    doc.table(ratingTableData, {
        prepareHeader: () => doc.fontSize(12),
        prepareRow: (row, i) => doc.fontSize(10),
    });
    doc.end();
    let buffers = [];
    pdfStream.on('data', buffers.push.bind(buffers));
    pdfStream.on('end', async () => {
        let pdfBuffer = Buffer.concat(buffers);
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: "preetkumar1970@gmail.com",
                pass: "qgun ookb ndqh dwbn",
            },
        });
        let mailOptions = {
            from: 'akrammanzoorabbasi@gmail.com',
            to: 'akrammanzoorabbasi@gmail.com',
            subject: emailSubject,
            text: 'Please find the attached PDF document for your submitted data.',
            attachments: [
                {
                    filename: 'data.pdf',
                    content: pdfBuffer,
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
