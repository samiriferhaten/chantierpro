const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { artisanEmail, clientName, jobSiteAddress, notes, pdfBase64 } = JSON.parse(event.body);

    const data = JSON.stringify({
      sender: { name: "ChantierPro", email: process.env.SENDER_EMAIL },
      to: [{ email: artisanEmail }],
      subject: `Mémo Chantier - ${clientName}`,
      htmlContent: `<p>Bonjour,</p><p>Voici le mémo de chantier pour <strong>${clientName}</strong>.</p><p><strong>Adresse du chantier :</strong> ${jobSiteAddress}</p><p><strong>Notes :</strong><br>${notes.replace(/
/g, '<br>')}</p><p>--<br>ChantierPro</p>`,
      attachment: [
        {
          content: pdfBase64,
          name: `Memo_Chantier_${clientName.replace(/\s+/g, '_')}.pdf`
        }
      ]
    });

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', chunk => responseBody += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(responseBody);
          } else {
            reject(new Error(`Brevo Error: ${responseBody}`));
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};