import { Form261Data, escapeHtml } from './mapper';
import { FORM_261_ASSETS, Form261Assets } from './embedded-assets';

function getAssets(): Form261Assets {
  return FORM_261_ASSETS;
}

function renderCellText(value: string, ltr: boolean = false): string {
  const clean = value.trim();
  if (!clean) return '&nbsp;';
  const safe = escapeHtml(clean);
  if (ltr) {
    return `<span dir="ltr" class="ltr-token">${safe}</span>`;
  }
  return `<span class="rtl-token">${safe}</span>`;
}

/**
 * Generates an exact A4 HTML representation of Ministry of Islamic Affairs Form (261)
 * modeled directly on the reference sheet `استمارة.jpeg`.
 * Used identically for both the Admin preview iframe (`window.print()`) and server PDF export.
 */
export function renderForm261Html(data: Form261Data): string {
  const assets = getAssets();

  const birthCellContent = data.birthPlaceAndDateHijri
    ? renderCellText(data.birthPlaceAndDateHijri)
    : '<span class="date-slashes">/ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; /</span>';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>استمارة معلومات شخصية (261) - ${escapeHtml(data.fullName || data.applicationId)}</title>
  <style>
    @font-face {
      font-family: 'AmiriOfficial';
      src: url('data:font/woff2;base64,${assets.amiriArabicRegularB64}') format('woff2');
      font-weight: 400;
      font-style: normal;
      unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F, U+202A-202E;
    }
    @font-face {
      font-family: 'AmiriOfficial';
      src: url('data:font/woff2;base64,${assets.amiriArabicBoldB64}') format('woff2');
      font-weight: 700;
      font-style: normal;
      unicode-range: U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+200C-200F, U+202A-202E;
    }
    @font-face {
      font-family: 'AmiriOfficial';
      src: url('data:font/woff2;base64,${assets.amiriLatinRegularB64}') format('woff2');
      font-weight: 400;
      font-style: normal;
      unicode-range: U+0000-00FF, U+2000-206F;
    }
    @font-face {
      font-family: 'AmiriOfficial';
      src: url('data:font/woff2;base64,${assets.amiriLatinBoldB64}') format('woff2');
      font-weight: 700;
      font-style: normal;
      unicode-range: U+0000-00FF, U+2000-206F;
    }

    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      background-color: #eef1ee;
      color: #111111;
      font-family: 'AmiriOfficial', 'Traditional Arabic', 'Tahoma', serif;
      direction: rtl;
    }

    .sheet-wrapper {
      display: flex;
      justify-content: center;
      padding: 14px 0;
    }

    .a4-page {
      width: 210mm;
      min-height: 296mm;
      background: #ffffff;
      padding: 8mm 14mm 7mm 14mm;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
      position: relative;
    }

    @media print {
      html, body {
        background: #ffffff !important;
      }
      .sheet-wrapper {
        padding: 0 !important;
        display: block !important;
      }
      .a4-page {
        width: 210mm !important;
        min-height: 0 !important;
        box-shadow: none !important;
        margin: 0 !important;
        padding: 7.5mm 14mm 6mm 14mm !important;
      }
    }

    /* Header Section matching reference JPEG */
    .header-grid {
      display: grid;
      grid-template-columns: 35% 19% 21% 25%;
      align-items: center;
      margin-bottom: 1.5mm;
    }

    .ministry-title {
      text-align: center;
      font-weight: 700;
      font-size: 12pt;
      line-height: 1.35;
      color: #111111;
    }

    .ministry-title .form-num {
      margin-top: 1mm;
      font-size: 11.5pt;
      font-weight: 700;
    }

    .emblem-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .emblem-wrap img {
      height: 26mm;
      width: auto;
      object-fit: contain;
    }

    .vision-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .vision-wrap img {
      width: 26mm;
      height: auto;
      object-fit: contain;
    }

    .photo-box-wrap {
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;
      padding-left: 4mm;
    }

    .photo-box {
      width: 23mm;
      height: 27mm;
      border: 1px solid #333333;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 9.2pt;
      line-height: 1.25;
      font-weight: 400;
      color: #111111;
      background: #ffffff;
    }

    .doc-title {
      text-align: center;
      font-size: 13pt;
      font-weight: 700;
      margin: 0 0 3mm 0;
      line-height: 1.3;
      color: #111111;
    }

    /* Official Tables matching exact geometry & sage-olive palette */
    table.form-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin-bottom: 3.6mm;
      font-size: 10.2pt;
    }

    table.form-table td,
    table.form-table th {
      border: 1px solid #2b2b2b;
      padding: 0.9mm 1.8mm;
      text-align: center;
      vertical-align: middle;
      color: #111111;
      word-break: break-word;
      overflow-wrap: anywhere;
      line-height: 1.3;
    }

    td.ghost-cell {
      border: none !important;
      background: transparent !important;
      padding: 0 !important;
      height: auto;
    }

    .tab-header {
      background-color: #c5d99f !important;
      font-weight: 700;
      font-size: 10.6pt;
      height: 6.2mm;
    }

    .sub-header {
      background-color: #e8f1dc !important;
      font-weight: 700;
      font-size: 10.2pt;
      height: 6.2mm;
    }

    .name-value-cell {
      background-color: #e8f1dc !important;
      font-weight: 700;
      font-size: 11.2pt;
      height: 8.2mm;
      line-height: 1.32 !important;
      padding: 1.2mm 3mm !important;
    }

    .data-cell {
      background-color: #ffffff !important;
      font-weight: 400;
      font-size: 10pt;
      height: 7.2mm;
      line-height: 1.3 !important;
    }

    .social-label-cell {
      background-color: #e8f1dc !important;
      font-weight: 700;
      font-size: 10.2pt;
      height: 6.8mm;
    }

    .social-value-cell {
      background-color: #ffffff !important;
      font-weight: 400;
      font-size: 10pt;
      height: 6.8mm;
      line-height: 1.3 !important;
    }

    .rtl-token {
      display: inline-block;
      direction: rtl;
      unicode-bidi: plaintext;
      max-width: 100%;
    }

    .ltr-token {
      display: inline-block;
      direction: ltr;
      unicode-bidi: isolate;
      max-width: 100%;
      font-size: 9.8pt;
    }

    .date-slashes {
      letter-spacing: 2px;
      color: #333333;
      font-size: 10.2pt;
    }

    /* Footer Notes & Signature Section */
    .footer-notes {
      margin-top: 2.5mm;
      font-size: 9.8pt;
      line-height: 1.5;
      color: #111111;
    }

    .absher-note {
      text-align: right;
      margin: 0 0 3mm 0;
    }

    .absher-note .bullet {
      font-size: 9pt;
      margin-left: 1.2mm;
    }

    .absher-note .u-bold {
      font-weight: 700;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .signature-inline {
      display: inline-block;
      margin-right: 3mm;
      white-space: nowrap;
    }

    .signature-line {
      display: inline-block;
      width: 48mm;
      border-bottom: 1px solid #111111;
      vertical-align: baseline;
      margin-right: 2mm;
    }

    .final-mandatory-note {
      text-align: center;
      font-weight: 700;
      font-size: 9.5pt;
      margin-top: 2mm;
    }
  </style>
</head>
<body>
  <div class="sheet-wrapper">
    <main class="a4-page" dir="rtl">

      <!-- Header: Official Titles, Emblem, Vision 2030, Male Photo Box -->
      <header class="header-grid">
        <div class="ministry-title">
          <div>المملكة العربية السعودية</div>
          <div>وزارة الشؤون الإسلامية والدعوة</div>
          <div>والارشاد</div>
          <div class="form-num">(261)</div>
        </div>

        <div class="emblem-wrap">
          <img
            src="data:image/png;base64,${assets.ministryEmblemB64}"
            alt="شعار وزارة الشؤون الإسلامية والدعوة والإرشاد"
          />
        </div>

        <div class="vision-wrap">
          <img
            src="data:image/png;base64,${assets.vision2030B64}"
            alt="رؤية المملكة 2030"
          />
        </div>

        <div class="photo-box-wrap">
          <div class="photo-box">
            <div>الصورة</div>
            <div>الشخصية</div>
            <div>للرجال</div>
            <div>فقط</div>
          </div>
        </div>
      </header>

      <h1 class="doc-title">استمارة معلومات شخصية</h1>

      <!-- 1. المعلومات الشخصية -->
      <table class="form-table" aria-label="الاسم الرباعي">
        <colgroup>
          <col style="width: 34.4%;" />
          <col style="width: 65.6%;" />
        </colgroup>
        <tbody>
          <tr>
            <th class="tab-header">الاسم الرباعي</th>
            <td class="ghost-cell"></td>
          </tr>
          <tr>
            <td colspan="2" class="name-value-cell">${renderCellText(data.fullName)}</td>
          </tr>
        </tbody>
      </table>

      <!-- 2. بيانات الهوية -->
      <table class="form-table" aria-label="بيانات الهوية">
        <colgroup>
          <col style="width: 34.4%;" />
          <col style="width: 33.5%;" />
          <col style="width: 32.1%;" />
        </colgroup>
        <tbody>
          <tr>
            <th class="tab-header">بيانات الهوية</th>
            <td colspan="2" class="ghost-cell"></td>
          </tr>
          <tr>
            <th class="sub-header">رقم الهوية</th>
            <th class="sub-header">نوع الهوية</th>
            <th class="sub-header">تاريخ الانتهاء</th>
          </tr>
          <tr>
            <td class="data-cell">${renderCellText(data.idNumber, true)}</td>
            <td class="data-cell">${renderCellText(data.idType)}</td>
            <td class="data-cell">${renderCellText(data.idExpiryDate)}</td>
          </tr>
          <tr>
            <th class="sub-header">الجنسية</th>
            <th class="sub-header">الجنس</th>
            <th class="sub-header">مكان وتاريخ الميلاد هجريًا</th>
          </tr>
          <tr>
            <td class="data-cell">${renderCellText(data.nationality)}</td>
            <td class="data-cell">${renderCellText(data.gender)}</td>
            <td class="data-cell">${birthCellContent}</td>
          </tr>
        </tbody>
      </table>

      <!-- 3. المؤهلات العلمية -->
      <table class="form-table" aria-label="المؤهلات العلمية">
        <colgroup>
          <col style="width: 24.8%;" />
          <col style="width: 25.2%;" />
          <col style="width: 25.0%;" />
          <col style="width: 25.0%;" />
        </colgroup>
        <tbody>
          <tr>
            <th colspan="2" class="tab-header">المؤهلات العلمية</th>
            <td colspan="2" class="ghost-cell"></td>
          </tr>
          <tr>
            <th class="sub-header">المؤهل العلمي</th>
            <th class="sub-header">التخصص</th>
            <th class="sub-header">مكان العمل</th>
            <th class="sub-header">المسمى الوظيفي</th>
          </tr>
          <tr>
            <td class="data-cell">${renderCellText(data.qualification)}</td>
            <td class="data-cell">${renderCellText(data.major)}</td>
            <td class="data-cell">${renderCellText(data.workplace)}</td>
            <td class="data-cell">${renderCellText(data.jobTitle)}</td>
          </tr>
        </tbody>
      </table>

      <!-- 4. العنوان -->
      <table class="form-table" aria-label="العنوان">
        <colgroup>
          <col style="width: 24.8%;" />
          <col style="width: 25.2%;" />
          <col style="width: 25.0%;" />
          <col style="width: 25.0%;" />
        </colgroup>
        <tbody>
          <tr>
            <th class="tab-header">العنوان</th>
            <td colspan="3" class="ghost-cell"></td>
          </tr>
          <tr>
            <th class="sub-header">رقم الهاتف</th>
            <th class="sub-header">رقم الجوال</th>
            <th class="sub-header">المدينة</th>
            <th class="sub-header">المنطقة</th>
          </tr>
          <tr>
            <td class="data-cell">${renderCellText(data.landlinePhone, true)}</td>
            <td class="data-cell">${renderCellText(data.mobilePhone, true)}</td>
            <td class="data-cell">${renderCellText(data.city)}</td>
            <td class="data-cell">${renderCellText(data.region)}</td>
          </tr>
          <tr>
            <th class="sub-header">الحي</th>
            <th class="sub-header">الشارع</th>
            <th class="sub-header">رقم المبنى</th>
            <th class="sub-header">رقم الشقة</th>
          </tr>
          <tr>
            <td class="data-cell">${renderCellText(data.district)}</td>
            <td class="data-cell">${renderCellText(data.street)}</td>
            <td class="data-cell">${renderCellText(data.buildingNumber)}</td>
            <td class="data-cell">${renderCellText(data.apartmentNumber)}</td>
          </tr>
        </tbody>
      </table>

      <!-- 5. عناوين مواقع التواصل الاجتماعي -->
      <table class="form-table" aria-label="عناوين مواقع التواصل الاجتماعي">
        <colgroup>
          <col style="width: 34.4%;" />
          <col style="width: 65.6%;" />
        </colgroup>
        <tbody>
          <tr>
            <th class="tab-header">عناوين مواقع التواصل الاجتماعي</th>
            <td class="ghost-cell"></td>
          </tr>
          <tr>
            <th class="social-label-cell">تويتر</th>
            <td class="social-value-cell">${renderCellText(data.xAccount, true)}</td>
          </tr>
          <tr>
            <th class="social-label-cell">فيسبوك</th>
            <td class="social-value-cell">${renderCellText(data.facebookAccount, true)}</td>
          </tr>
          <tr>
            <th class="social-label-cell">البريد الالكتروني الشخصي</th>
            <td class="social-value-cell">${renderCellText(data.email, true)}</td>
          </tr>
        </tbody>
      </table>

      <!-- 6. المعلومات الختامية -->
      <footer class="footer-notes">
        <p class="absher-note">
          <span class="bullet">&#9679;</span>
          <strong>ملحوظة:</strong>
          ( عند ورود رسالة نصية لكم من قبل الأدلة الجنائية تتطلب موافقتكم عليها وذلك بالدخول على منصة
          <span class="u-bold">أبشر</span>
          الخاصة بكم ثم اختيار
          <span class="u-bold">خدماتي</span>
          ثم اختيار
          <span class="u-bold">خدمات عامة</span>
          ثم
          <span class="u-bold">قبول</span>).
          <span class="signature-inline">
            <strong>التوقيع بالعلم</strong>
            <span class="signature-line">&nbsp;</span>
          </span>
        </p>

        <div class="final-mandatory-note">
          - ملاحظة: تعبئة جميع الحقول إلزامية على أن تكون مطبوعة وليست بخط اليد.
        </div>
      </footer>

    </main>
  </div>
</body>
</html>`;
}
