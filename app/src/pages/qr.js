"use strict";

const FIXED_LOCATION = "72 Hinchey Road, Rochester, NY 14624";
    const FIXED_DESCRIPTION = "Phone: 585-467-2230";
    const CONTACT_VCF_URL = new URL("../../assets/contacts/delphi-rise-contact.vcf", window.location.href).toString();

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function formatDateForICS(dateStr, timeStr) {
        const [year, month, day] = dateStr.split("-");
        const [hour, minute] = timeStr.split(":");
        return `${year}${month}${day}T${pad(hour)}${pad(minute)}00`;
    }

    function escapeICS(text) {
        return String(text)
            .replace(/\\/g, "\\\\")
            .replace(/\n/g, "\\n")
            .replace(/,/g, "\\,")
            .replace(/;/g, "\\;");
    }

    // No longer embed full vCard in QR; we point to a hosted .vcf instead

    function buildIcsString({ title, date, startTime, endTime, location, description }) {
        const dtStart = formatDateForICS(date, startTime);
        const dtEnd = formatDateForICS(date, endTime);
        const now = new Date();
        const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
        const uid = `delphi-${Date.now()}-${Math.random().toString(16).slice(2)}@delphirise`;

        return [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Delphi Rise//Appointment QR//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "BEGIN:VEVENT",
            `UID:${uid}`,
            `DTSTAMP:${stamp}`,
            `SUMMARY:${escapeICS(title)}`,
            `DTSTART:${dtStart}`,
            `DTEND:${dtEnd}`,
            `LOCATION:${escapeICS(location)}`,
            `DESCRIPTION:${escapeICS(description)}`,
            "BEGIN:VALARM",
            "ACTION:DISPLAY",
            "DESCRIPTION:Appointment reminder",
            "TRIGGER:-PT12H",
            "END:VALARM",
            "END:VEVENT",
            "END:VCALENDAR"
        ].join("\r\n");
    }

    function getEventFromInputs() {
        return {
            title: document.getElementById("title").value,
            date: document.getElementById("date").value,
            startTime: document.getElementById("startTime").value,
            endTime: document.getElementById("endTime").value,
            location: FIXED_LOCATION,
            description: FIXED_DESCRIPTION
        };
    }

    function validateEvent(eventData) {
        if (!eventData.date || !eventData.startTime || !eventData.endTime) {
            return "Please enter date, start time, and end time.";
        }
        if (eventData.endTime <= eventData.startTime) {
            return "End time must be later than start time.";
        }
        return "";
    }

    function updateQr() {
        const qrcodeContainer = document.getElementById("qrcode");
        const qrLabel = document.querySelector(".qr-label");
        const mode = document.getElementById("qrMode").value;

        qrcodeContainer.innerHTML = "";

        if (mode === "contact") {
            qrLabel.textContent = "Scan to Add Contact";

            if (!window.QRCode) {
                qrcodeContainer.innerHTML = `<div style="color: #dc2626; font-weight: 600; text-align: center;">QR library failed to load.</div>`;
                return;
            }

            new QRCode(qrcodeContainer, {
                text: CONTACT_VCF_URL,
                width: 380,
                height: 380,
                correctLevel: QRCode.CorrectLevel.M
            });
            return;
        }

        // Appointment mode
        qrLabel.textContent = "Scan to Add Event";
        const eventData = getEventFromInputs();
        const error = validateEvent(eventData);

        if (error) {
            qrcodeContainer.innerHTML = `<div style="color: #dc2626; font-weight: 600; text-align: center;">${error}</div>`;
            return;
        }

        const icsPayload = buildIcsString(eventData);

        if (!window.QRCode) {
            qrcodeContainer.innerHTML = `<div style="color: #dc2626; font-weight: 600; text-align: center;">QR library failed to load.</div>`;
            return;
        }

        new QRCode(qrcodeContainer, {
            text: icsPayload,
            width: 380,
            height: 380,
            correctLevel: QRCode.CorrectLevel.M
        });
    }

    function runBuilderMode() {
        const now = new Date();
        const plusOneHour = new Date(now.getTime() + 60 * 60 * 1000);

        const dateValue = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const startValue = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const endValue = `${pad(plusOneHour.getHours())}:${pad(plusOneHour.getMinutes())}`;

        const dateInput = document.getElementById("date");
        const startInput = document.getElementById("startTime");
        const endInput = document.getElementById("endTime");

        dateInput.value = dateValue;
        startInput.value = startValue;
        endInput.value = endValue;

        ["title", "date", "startTime", "endTime"].forEach((id) => {
            document.getElementById(id).addEventListener("input", updateQr);
            document.getElementById(id).addEventListener("change", updateQr);
        });

        document.getElementById("qrMode").addEventListener("change", updateQr);
        updateQr();
    }

    function disablePredictiveText() {
        document.querySelectorAll('input[type="text"], input[type="date"], input[type="time"], textarea').forEach((element) => {
            element.setAttribute('autocomplete', 'off');
            element.setAttribute('autocorrect', 'off');
            element.setAttribute('autocapitalize', 'none');
            element.setAttribute('spellcheck', 'false');
        });
    }

    (function init() {
        disablePredictiveText();
        runBuilderMode();
    })();
