const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const puppeteer = require("puppeteer");
const { PassThrough } = require("stream");
const PDFDocument = require("pdfkit-table");

const app = express();
app.use(cors());
app.use(express.json());

const generateHTML = (arrayData) => {
    const createTableRows = (data) => data.map(item => {
        const commonTable = (headers, rows) => `
            <table border="1" style="border-collapse: collapse; width: 100%;" class="nested-table">
                <thead><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr></thead>
                <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell || ''}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
        `;

        if (item.items && Array.isArray(item.items)) {
            switch (item.label) {
                case "Invoicing":
                    return `
                        <tr><td>${item.label || ''}</td><td>${commonTable(
                            ["Amount", "Comments", "Name", "Type"],
                            item.items.map(subItem => [subItem.amount, subItem.comments, subItem.name, subItem.type])
                        )}</td></tr>`;
                case "Attachments":
                    return `
                        <tr><td>${item.label || ''}</td><td>${commonTable(
                            ["Label", "Values"],
                            item.items.map(attachment => [attachment.label, attachment.values.join(', ')])
                        )}</td></tr>`;
                case "Final recap and comments":
                case "Other special agreements":
                    return `
                        <tr><td>${item.label || ''}</td><td>${commonTable(
                            ["Label", "Value"],
                            item.items.map(subItem => [subItem.label, subItem.value])
                        )}</td></tr>`;
                case "Estimate – port and cargo":
                    return `
                        <tr><td>${item.label || ''}</td><td>${commonTable(
                            ["Index", "Port Name", "Agent Name", "Post Amount", "Post Currency", "Liner Amount", "Liner Currency", "PDA Attachment"],
                            item.items.map(subItem => [
                                subItem.index, subItem.portName, subItem.agentName, subItem.postAmount,
                                subItem.postCurrency, subItem.linerAmount, subItem.linerCurrency, subItem.pdaAttachment
                            ])
                        )}</td></tr>`;
                case "Stowage details":
                    return `
                        <tr><td>${item.label || ''}</td><td>${commonTable(
                            ["Label", "Value"],
                            item.items.map(subItem => Array.isArray(subItem.value) ?
                                [
                                    subItem.label,
                                    `<table border="1" style="border-collapse: collapse; width: 100%;" class="nested-table">
                                        <thead><tr><th>Label</th><th>Value</th></tr></thead>
                                        <tbody>${subItem.value.map(innerItem => `<tr><td>${innerItem.label}</td><td>${innerItem.value}</td></tr>`).join('')}</tbody>
                                    </table>`
                                ] : [subItem.label, subItem.value]
                            )
                        )}</td></tr>`;
                default:
                    return `<tr><td>${item.label || ''}</td><td>${item.value || ''}</td></tr>`;
            }
        } else if (item.value && typeof item.value === 'object') {
            const headers = ["Key", "Value"];
            const rows = Object.entries(item.value).map(([key, value]) => [key, value]);
            return `<tr><td>${item.label || ''}</td><td>${commonTable(headers, rows)}</td></tr>`;
        } else {
            return `<tr><td>${item.label || ''}</td><td>${item.value || ''}</td></tr>`;
        }
    }).join('');

    return `
        <html>
        <head>
            <style>
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid black; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .nested-table { margin-top: 10px; margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <h1>Your Submitted Data</h1>
            <table><thead><tr><th>Label</th><th>Value</th></tr></thead><tbody>${createTableRows(arrayData)}</tbody></table>
        </body>
        </html>
    `;
};

const sendEmail = async (emailOptions) => {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "preetkumar1970@gmail.com",
            pass: "qgun ookb ndqh dwbn"
        }
    });
    await transporter.sendMail(emailOptions);
};

app.post("/send-email", async (req, res) => {
    const { arrayData, formValues1, data } = req.body;

    if (!Array.isArray(arrayData) || typeof formValues1 !== "object") {
        return res.status(400).send("Invalid request. Please provide valid array and form values.");
    }

    const isForm1 = data === "form1";
    const { nominatedVessel = "N/A", intendedRotation = "N/A", carrierEntity = "N/A" } = formValues1;
    const emailSubject = isForm1 ? 
        `Subject Line: ${nominatedVessel}, Intended Rotation: ${intendedRotation}, Carrier Entity: ${carrierEntity}` :
        `Customers Feedback-${carrierEntity}-${nominatedVessel}`;

    try {
        const htmlContent = generateHTML(arrayData);

        if (isForm1) {
            const browser = await puppeteer.launch({
                executablePath: 'C:\Program Files\Google\Chrome\Application\chrome.exe'
            });
            const page = await browser.newPage();
            await page.setContent(htmlContent);
            const pdfBuffer = await page.pdf({ format: 'A4' });
            await browser.close();

            const emailOptions = {
                from: "aq579733@gmail.com",
                to: "aq579733@gmail.com",
                subject: emailSubject,
                text: "Please find the attached PDF document for your submitted data.",
                attachments: [{ filename: "data.pdf", content: pdfBuffer, contentType: "application/pdf" }]
            };
            await sendEmail(emailOptions);
            res.status(200).send("Email sent successfully with PDF attachment!");
        } 
        else {
            const doc = new PDFDocument();
            const pdfStream = new PassThrough();
            doc.pipe(pdfStream);
            doc.fontSize(16).text("Your Submitted Data", { align: "center" });

            const tableData = {
                headers: ["Label", "Value"],
                rows: arrayData.filter((item, index) => index !== 9 && !item.rating).map(item => [item.label, item.value])
            };
            doc.fontSize(12).text("General Data");
            doc.table(tableData, { prepareHeader: () => doc.fontSize(12), prepareRow: (row) => doc.fontSize(10) });

            const ratingTableData = {
                headers: ["Label", "Rating", "Comment"],
                rows: arrayData.filter(item => item.rating).map(item => [item.label, item.rating, item.comment || "No Comment"])
            };
            doc.fontSize(16).text("Ratings and Comments", { align: "center" });
            doc.table(ratingTableData, { prepareHeader: () => doc.fontSize(12), prepareRow: (row) => doc.fontSize(10) });

            const generalCommentsData = arrayData[9] || { label: "General Comments", value: "No General Comments Provided" };
            const generalCommentsTableData = {
                headers: ["Label", "Comment"],
                rows: [[generalCommentsData.label, generalCommentsData.value]]
            };
            doc.fontSize(16).text("General Comments", { align: "center" });
            doc.table(generalCommentsTableData, { prepareHeader: () => doc.fontSize(12), prepareRow: (row) => doc.fontSize(10) });

            doc.end();
            const buffers = [];
            pdfStream.on("data", buffers.push.bind(buffers));
            pdfStream.on("end", async () => {
                const pdfBuffer = Buffer.concat(buffers);
                const emailOptions = {
                    from: "HSEQ@Ocean7projects.com",
                    to: "HSEQ@Ocean7projects.com",
                    subject: emailSubject,
                    text: "Please find the attached PDF document for your submitted data.",
                    attachments: [{ filename: "data.pdf", content: pdfBuffer, contentType: "application/pdf" }]
                };
                await sendEmail(emailOptions);
                res.status(200).send("Email sent successfully with PDF attachment!");
            });
            pdfStream.on("error", () => res.status(500).send("Error generating PDF."));
        }
    } catch (error) {
        console.error("Error generating PDF or sending email:", error);
        res.status(500).send("An error occurred while generating the PDF or sending the email.");
    }
});

app.listen(5000, () => {
    console.log("Server started on port 5000");
});
