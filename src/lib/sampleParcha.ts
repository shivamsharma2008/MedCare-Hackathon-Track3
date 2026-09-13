// Helper to generate a realistic sample handwritten prescription / parcha image
export function generateSampleParchaBase64(): string {
  if (typeof document === "undefined") {
    return "";
  }
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1600;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Paper Background with warm texture
  ctx.fillStyle = "#faf7f0";
  ctx.fillRect(0, 0, 1200, 1600);

  // Subtle paper borders & watermark
  ctx.strokeStyle = "#e5ddce";
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 1140, 1540);

  // Header banner / Clinic Letterhead
  ctx.fillStyle = "#0f766e";
  ctx.fillRect(40, 40, 1120, 160);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 38px sans-serif";
  ctx.fillText("MEDCARE PRIMARY RURAL CLINIC", 80, 100);

  ctx.font = "20px sans-serif";
  ctx.fillStyle = "#99f6e4";
  ctx.fillText("Dr. Anand Sharma (MBBS, MD) - Reg No: MCI-2018-84729", 80, 135);
  ctx.fillText("Station Road, Sector 4, Civil Lines • Ph: +91 98765 43210", 80, 165);

  // Patient Info Box (Handwritten style simulation)
  ctx.fillStyle = "#f3eee3";
  ctx.fillRect(50, 220, 1100, 140);
  ctx.strokeStyle = "#d6cbb8";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(50, 220, 1100, 140);

  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("Patient Name:", 70, 260);
  ctx.fillText("Age / Gender:", 70, 305);
  ctx.fillText("Date:", 750, 260);
  ctx.fillText("Blood Pressure:", 750, 305);

  // Handwritten blue ink text for patient info
  ctx.fillStyle = "#1e3a8a";
  ctx.font = "italic bold 28px 'Courier New', serif";
  ctx.fillText("Rajesh Patel", 240, 260);
  ctx.fillText("48 Yrs / Male", 240, 305);
  const todayStr = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  ctx.fillText(todayStr, 830, 260);
  ctx.fillText("138 / 88 mmHg", 930, 305);

  // Symptoms & Diagnosis
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 24px sans-serif";
  ctx.fillText("Clinical Complaints & Diagnosis:", 70, 400);

  ctx.fillStyle = "#1e3a8a";
  ctx.font = "italic bold 26px 'Courier New', serif";
  ctx.fillText("• Elevated fasting blood sugar (164 mg/dL)", 100, 445);
  ctx.fillText("• Occasional dizziness & morning headache x 10 days", 100, 485);
  ctx.fillText("• Dx: Type 2 Diabetes Mellitus + Essential Hypertension", 100, 525);

  // Rx Symbol
  ctx.fillStyle = "#0f766e";
  ctx.font = "bold 56px serif";
  ctx.fillText("℞", 70, 610);

  // Medication Table Header
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 22px sans-serif";
  ctx.fillText("Medicine Name & Strength", 150, 600);
  ctx.fillText("Dosage & Frequency", 640, 600);
  ctx.fillText("Duration", 960, 600);

  ctx.strokeStyle = "#0f766e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(70, 620);
  ctx.lineTo(1130, 620);
  ctx.stroke();

  // Handwritten Medicines list
  const meds = [
    {
      name: "1. Tab. Metformin (Glycomet) 500mg",
      dosage: "1 tablet - Twice Daily (1-0-1)",
      instruct: "After meals (Morning & Dinner)",
      dur: "30 Days",
    },
    {
      name: "2. Tab. Telmisartan (Telma) 40mg",
      dosage: "1 tablet - Once Daily (1-0-0)",
      instruct: "Morning after breakfast",
      dur: "30 Days",
    },
    {
      name: "3. Tab. Atorvastatin (Atorva) 10mg",
      dosage: "1 tablet - Once Night (0-0-1)",
      instruct: "At bedtime with water",
      dur: "30 Days",
    },
    {
      name: "4. Tab. Neurobion Forte",
      dosage: "1 tablet - Daily (0-1-0)",
      instruct: "After lunch",
      dur: "15 Days",
    },
  ];

  let currentY = 670;
  meds.forEach((m) => {
    ctx.fillStyle = "#1e3a8a";
    ctx.font = "italic bold 26px 'Courier New', serif";
    ctx.fillText(m.name, 90, currentY);

    ctx.font = "italic 22px 'Courier New', serif";
    ctx.fillText(m.dosage, 640, currentY);
    ctx.fillText(m.dur, 960, currentY);

    ctx.fillStyle = "#475569";
    ctx.font = "18px sans-serif";
    ctx.fillText(`[${m.instruct}]`, 120, currentY + 30);

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(90, currentY + 45);
    ctx.lineTo(1110, currentY + 45);
    ctx.stroke();

    currentY += 95;
  });

  // Doctor Advice / Lifestyle box
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(70, 1100, 1060, 200);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  ctx.strokeRect(70, 1100, 1060, 200);

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 20px sans-serif";
  ctx.fillText("Special Dietary & Lifestyle Advice:", 90, 1135);

  ctx.fillStyle = "#1e3a8a";
  ctx.font = "italic 22px 'Courier New', serif";
  ctx.fillText("1. Strict low sodium (< 3g/day) & zero refined sugar intake.", 110, 1175);
  ctx.fillText("2. Brisk walking 30 mins daily in morning or evening.", 110, 1215);
  ctx.fillText("3. Re-check HbA1c, Fasting Glucose & Serum Creatinine after 4 weeks.", 110, 1255);

  // Footer & Signature
  ctx.fillStyle = "#334155";
  ctx.font = "18px sans-serif";
  ctx.fillText("Follow up in Clinic: After 30 Days with fresh Lab Reports", 70, 1420);

  ctx.fillStyle = "#1e3a8a";
  ctx.font = "italic bold 32px 'Brush Script MT', cursive, serif";
  ctx.fillText("Dr. Anand Sharma", 880, 1440);

  ctx.fillStyle = "#64748b";
  ctx.font = "16px sans-serif";
  ctx.fillText("Authorized Signature & Seal", 870, 1475);

  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(850, 1455);
  ctx.lineTo(1120, 1455);
  ctx.stroke();

  return canvas.toDataURL("image/jpeg", 0.92);
}
