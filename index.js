const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const pdf = require("html-pdf");
const { PassThrough } = require("stream");
const PDFDocument = require("pdfkit-table");

const app = express();
app.use(cors());
app.use(express.json());

const generateHTML = (arrayData) => {
    const createTableRows = (data) => {
        return data.map(item => {
            if (item.items && Array.isArray(item.items)) {
                if (item.label === "Invoicing") {
                    if (Array.isArray(item.items)) {
                        return `
                        <tr>
                            <td>${item.label || ''}</td>
                            <td>
                                <table border="1" style="border-collapse: collapse; width: 100%;" class="nested-table">
                                    <thead>
                                        <tr>
                                            <th>Amount</th>
                                            <th>Comments</th>
                                            <th>Name</th>
                                            <th>Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${item.items.map(subItem => `
                                            <tr>
                                                <td>${subItem.amount || ''}</td>
                                                <td>${subItem.comments || ''}</td>
                                                <td>${subItem.name || ''}</td>
                                                <td>${subItem.type || ''}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    `;
                    }
                }
                else if (item.label === "Attachments") {
                    return `
                        <tr>
                            <td>${item.label || ''}</td>
                            <td>
                                <table border="1" style="border-collapse: collapse; width: 100%;" class="nested-table">
                                    <thead>
                                        <tr><th>Label</th><th>Values</th></tr>
                                    </thead>
                                    <tbody>
                                        ${item.items.map(attachment => `
                                            <tr>
                                                <td>${attachment.label || ''}</td>
                                                <td>${attachment.values.join(', ') || ''}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    `;
                }
                else if (item.label === "Final recap and comments") {
                    return `
                        <tr>
                            <td>${item.label || ''}</td>
                            <td>
                                <table border="1" style="border-collapse: collapse; width: 100%;" class="nested-table">
                                    <thead>
                                        <tr><th>Label</th><th>Value</th></tr>
                                    </thead>
                                    <tbody>
                                        ${item.items.map(subItem => `
                                            <tr>
                                                <td>${subItem.label || ''}</td>
                                                <td>${subItem.value || ''}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    `;
                }
                else if (item.label === "Estimate – port and cargo") {
                    return `
                        <tr>
                            <td>${item.label || ''}</td>
                            <td>
                                <table border="1" style="border-collapse: collapse; width: 100%;" class="nested-table">
                                    <thead>
                                        <tr>
                                            <th>Index</th>
                                            <th>Port Name</th>
                                            <th>Agent Name</th>
                                            <th>Post Amount</th>
                                            <th>Post Currency</th>
                                            <th>Liner Amount</th>
                                            <th>Liner Currency</th>
                                            <th>PDA Attachment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${item.items.map(subItem => `
                                            <tr>
                                                <td>${subItem.index || ''}</td>
                                                <td>${subItem.portName || ''}</td>
                                                <td>${subItem.agentName || ''}</td>
                                                <td>${subItem.postAmount || ''}</td>
                                                <td>${subItem.postCurrency || ''}</td>
                                                <td>${subItem.linerAmount || ''}</td>
                                                <td>${subItem.linerCurrency || ''}</td>
                                                <td>${subItem.pdaAttachment || ''}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    `;
                }
                else if (item.label === "Stowage details") {
                    return `
                        <tr>
                            <td>${item.label || ''}</td>
                            <td>
                                <table border="1" style="border-collapse: collapse; width: 100%;" class="nested-table">
                                    <thead>
                                        <tr><th>Label</th><th>Value</th></tr>
                                    </thead>
                                    <tbody>
                                        ${item.items.map(subItem => {
                        if (Array.isArray(subItem.value)) {
                            // Handling nested arrays within value
                            return `
                                                    <tr>
                                                        <td>${subItem.label || ''}</td>
                                                        <td>
                                                            <table border="1" style="border-collapse: collapse; width: 100%;" class="nested-table">
                                                                <thead>
                                                                    <tr><th>Label</th><th>Value</th></tr>
                                                                </thead>
                                                                <tbody>
                                                                    ${subItem.value.map(innerItem => `
                                                                        <tr>
                                                                            <td>${innerItem.label || ''}</td>
                                                                            <td>${innerItem.value || ''}</td>
                                                                        </tr>
                                                                    `).join('')}
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                `;
                        } else {
                            return `
                                                    <tr>
                                                        <td>${subItem.label || ''}</td>
                                                        <td>${subItem.value || ''}</td>
                                                    </tr>
                                                `;
                        }
                    }).join('')}
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    `;
                }
                else if (item.label === "Other special agreements") {
                    return `
                        <tr>
                            <td>${item.label || ''}</td>
                            <td>
                                <table border="1" style="border-collapse: collapse; width: 100%;" class="nested-table">
                                    <thead>
                                        <tr><th>Label</th><th>Value</th></tr>
                                    </thead>
                                    <tbody>
                                        ${item.items.map(subItem => `
                                            <tr>
                                                <td>${subItem.label || ''}</td>
                                                <td>${subItem.value || ''}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    `;
                }
            }
            else if (item.value && typeof item.value === 'object') {
                if (item.label === 'Terms') {
                    return `
                    <tr>
                         <td>${item.label || ''}</td>
                         <td>
                             <table border="1" style="border-collapse: collapse; width: 100%;" class="nested-table">
                                 <thead>
                                     <tr><th>Key</th><th>sarosh</th></tr>
                                 </thead>
                                 <tbody>
                                     ${Object.entries(item.value).map(([key, value]) => `
                                         <tr>
                                             <td>${key}</td>
                                             <td>${value}</td>
                                         </tr>
                                     `).join('')}
                                 </tbody>
                             </table>
                         </td>
                     </tr>
                 `;
                }
                else if (item.label === 'Warriskinsurance') {
                    return `
                    <tr>
                        <td>${item.label || ''}</td>
                        <td>
                            <table border="1" style="border-collapse: collapse; width: 100%;" class="nested-table">
                                <thead>
                                    <tr>
                                        <th>Detail</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Amount</td>
                                        <td>${item.value.amount || ''}</td>
                                    </tr>
                                    <tr>
                                        <td>Comments</td>
                                        <td>${item.value.comments || ''}</td>
                                    </tr>
                                    <tr>
                                        <td>Currency</td>
                                        <td>${item.value.currency || ''}</td>
                                    </tr>
                                    <tr>
                                        <td>Name</td>
                                        <td>${item.value.name || ''}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                `;
                }
                else if (item.label === 'Guards (GoA, Gulf of Guinea etc.)') {
                    return `
                    <tr>
                        <td>${item.label || ''}</td>
                        <td>
                            <table border="1" style="border-collapse: collapse; width: 100%;" class="nested-table">
                                <thead>
                                    <tr>
                                        <th>Detail</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Amount</td>
                                        <td>${item.value.amount || ''}</td>
                                    </tr>
                                    <tr>
                                        <td>Comments</td>
                                        <td>${item.value.comments || ''}</td>
                                    </tr>
                                    <tr>
                                        <td>Currency</td>
                                        <td>${item.value.currency || ''}</td>
                                    </tr>
                                    <tr>
                                        <td>Name</td>
                                        <td>${item.value.name || ''}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                `;
                }
            } else {
                return `
                    <tr>
                        <td>${item.label || ''}</td>
                        <td>${item.value || ''}</td>
                    </tr>
                `;
            }
        }).join('');
    };

    const html = `
        <html>
        <head>
            <style>
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    border: 1px solid black;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
                .nested-table {
                    margin-top: 10px;
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <h1>Your Submitted Data</h1>
            <table>
                <thead>
                    <tr>
                        <th>Label</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${createTableRows(arrayData)}
                </tbody>
            </table>
        </body>
        </html>
    `;
    return html;
};



app.post("/send-email", async (req, res) => {
    const { arrayData, formValues1, data } = req.body;

    if (data === "form1") {
        if (!Array.isArray(arrayData) || typeof formValues1 !== "object") {
            return res.status(400).send("Invalid request. Please provide a valid array and form values.");
        }

        const { nominatedVessel = "N/A", intendedRotation = "N/A", carrierEntity = "N/A" } = formValues1;
        const emailSubject = `Subject Line: ${nominatedVessel}, Intended Rotation: ${intendedRotation}, Carrier Entity: ${carrierEntity}`;

        const htmlContent = generateHTML(arrayData);

        pdf.create(htmlContent).toStream((err, stream) => {
            if (err) {
                console.error("Error generating PDF:", err);
                return res.status(500).send("Failed to generate PDF.");
            }

            const buffers = [];
            stream.on("data", chunk => buffers.push(chunk));
            stream.on("end", async () => {
                const pdfBuffer = Buffer.concat(buffers);

                let transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: "preetkumar1970@gmail.com",
                        pass: "qgun ookb ndqh dwbn",
                    },
                });

                let mailOptions = {
                    from: "yousufkhalid855@gmail.com",
                    to: "yousufkhalid855@gmail.com",
                    subject: emailSubject,
                    text: "Please find the attached PDF document for your submitted data.",
                    attachments: [
                        {
                            filename: "data.pdf",
                            content: pdfBuffer,
                            contentType: "application/pdf",
                        },
                    ],
                };

                try {
                    await transporter.sendMail(mailOptions);
                    res.status(200).send("Email sent successfully with PDF attachment!");
                } catch (error) {
                    console.error("Error sending email:", error);
                    res.status(500).send("Failed to send email.");
                }
            });

            stream.on("error", (error) => {
                console.error("Error generating PDF stream:", error);
                res.status(500).send("Failed to generate PDF.");
            });
        });
    }
    else {
        if (!Array.isArray(arrayData) || typeof formValues1 !== "object") {
            return res
                .status(400)
                .send("Invalid request. Please provide a valid array.");
        }

        const nominatedVessel = formValues1.carrierEntity || "N/A";
        const carrierEntity = formValues1.nominatedVessel || "N/A";
        const emailSubject = `Customers Feedback-${carrierEntity}-${nominatedVessel}  `;

        const doc = new PDFDocument();
        const pdfStream = new PassThrough();

        doc.pipe(pdfStream);

        doc.fontSize(16).text("Your Submitted Data", { align: "center" });

        const tableData = {
            headers: ["Label", "Value"],
            rows: arrayData
                .filter((item, index) => index !== 9 && !item.rating)
                .map((item) => [item.label, item.value]),
        };

        doc.fontSize(12).text("General Data");
        doc.table(tableData, {
            prepareHeader: () => doc.fontSize(12),
            prepareRow: (row, i) => doc.fontSize(10),
        });

        const ratingTableData = {
            headers: ["Label", "Rating", "Comment"],
            rows: arrayData
                .filter((item) => item.rating)
                .map((item) => [item.label, item.rating, item.comment || "No Comment"]),
        };

        doc.fontSize(16).text("Ratings and Comments", { align: "center" });
        doc.table(ratingTableData, {
            prepareHeader: () => doc.fontSize(12),
            prepareRow: (row, i) => doc.fontSize(10),
        });

        const generalCommentsData = arrayData[9] || { label: "General Comments", value: "No General Comments Provided" };


        const generalCommentsTableData = {
            headers: ["Label", "Comment"],
            rows: [[generalCommentsData.label, generalCommentsData.value]],
        };

        doc.fontSize(16).text("General Comments", { align: "center" });
        doc.table(generalCommentsTableData, {
            prepareHeader: () => doc.fontSize(12),
            prepareRow: (row, i) => doc.fontSize(10),
        });

        doc.end();

        let buffers = [];
        pdfStream.on("data", buffers.push.bind(buffers));
        pdfStream.on("end", async () => {
            let pdfBuffer = Buffer.concat(buffers);

            let transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: "yousufkhalid855@gmail.com",
                    pass: "gmpt gojl kvdd bele",
                },
            });

            let mailOptions = {
                from: "HSEQ@Ocean7projects.com",
                to: "HSEQ@Ocean7projects.com",
                subject: emailSubject,
                text: "Please find the attached PDF document for your submitted data.",
                attachments: [
                    {
                        filename: "data.pdf",
                        content: pdfBuffer,
                        contentType: "application/pdf",
                    },
                ],
            };

            try {
                await transporter.sendMail(mailOptions);
                res.status(200).send("Email sent successfully with PDF attachment!");
            } catch (error) {
                console.error("Error sending email:", error);
                res.status(500).send("Failed to send email.");
            }
        });

        pdfStream.on("error", (error) => {
            console.error("Error generating PDF:", error);
            res.status(500).send("Failed to generate PDF.");
        });
    }
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
