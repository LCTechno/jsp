// hosted-code.js
const expirationDate = new Date("2024-09-24T23:59:59"); // Fecha límite

async function fetchData(resultDiv, apiKey, centerId) {
  const currentDate = new Date();

  // Verificar si la fecha actual está después de la fecha límite
  if (currentDate > expirationDate) {
    resultDiv.innerHTML = "Error Key Servidor origen.";
    return;
  }

  let hasMorePages;
  let page = 1;
  const perPage = 100;
  const athletes = [];
  try {
    resultDiv.innerHTML = "loading...";
    do {
      const response = await fetch(
        `https://crosshero.com/api/v1/athletes?page=${page}&per_page=${perPage}`, {
          headers: {
            CROSSHERO_BOX: centerId,
            CROSSHERO_ACCESS_TOKEN: apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      hasMorePages = data.athletes.length >= perPage;
      page++;
      athletes.push(...data.athletes);
    } while (hasMorePages);

    const csvHeader = "user_id,name,start_datetime,expiry_datetime";

    const csvRows = athletes.map(athlete => {
      if (
        athlete.document_id && athlete.name && athlete.since &&
        athlete.document_id.trim() !== '' && athlete.name.trim() !== '' && athlete.since.trim() !== ''
      ) {
        const rawStartDate = new Date(athlete.since);
        const formattedStartDate = rawStartDate.toISOString().slice(0, 19).replace("T", " ");

        const expiryDate = new Date(currentDate);

        if (athlete.status === "active") {
          expiryDate.setDate(expiryDate.getDate() + 2);
        } else {
          expiryDate.setHours(0, 0, 0, 0);
        }

        const formattedExpiryDate = expiryDate.toISOString().slice(0, 19).replace("T", " ");
        const cleanedDocumentId = athlete.document_id.replace(/[^0-9]/g, '').replace(/^0+/, '');
        const cleanedName = athlete.name.replace(/,+/g, "").replace(/  +/g, " ");

        return `${cleanedDocumentId.trim()},${cleanedName.trim()},${formattedStartDate},${formattedExpiryDate}`;
      } else {
        return '';
      }
    });

    const filteredCsvRows = csvRows.filter(row => row !== '');

    const csvContent = `${csvHeader}\n${filteredCsvRows.join("\n")}`;

    const csvBlob = new Blob([csvContent], {
      type: "text/csv"
    });
    const csvUrl = URL.createObjectURL(csvBlob);
    const filename = "sportclub" + new Date().toISOString().replace(/[-T:.Z]/g, '') + ".csv";
    const downloadLink = document.createElement("a");
    downloadLink.href = csvUrl;
    downloadLink.download = filename;
    downloadLink.textContent = filename;

    resultDiv.innerHTML = "";
    resultDiv.appendChild(downloadLink);
  } catch (error) {
    resultDiv.innerHTML = `Error: ${error.message}`;
  }
}
