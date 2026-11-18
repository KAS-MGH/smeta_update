(function () {
  'use strict';

  var rowsEl = document.getElementById('rows');
  var totalEl = document.getElementById('total');
  var addBtn = document.getElementById('add');
  var dateEl = document.getElementById('date');

  var UNITS = ['шт', 'час', 'услуга'];

  // Пустое и неверное число — это 0, отрицательное тоже.
  function toNumber(text) {
    var s = String(text == null ? '' : text)
      .replace(/[\s  ]/g, '')
      .replace(',', '.');
    var n = Number(s);
    if (s === '' || !isFinite(n) || n < 0) return 0;
    return n;
  }

  var currency = '₸';

  // 15000 -> "15 000 ₸" (округляем до целых)
  function formatMoney(value) {
    var n = isFinite(value) ? Math.round(value) : 0;
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ' + currency;
  }

  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function cell(label, child, extraClass) {
    var td = document.createElement('td');
    if (extraClass) td.className = extraClass;
    var span = document.createElement('span');
    span.className = 'cell-label';
    span.textContent = label;
    td.appendChild(span);
    td.appendChild(child);
    return td;
  }

  function createRow() {
    var tr = document.createElement('tr');

    var name = document.createElement('input');
    name.type = 'text';
    name.className = 'in-name';

    var qty = document.createElement('input');
    qty.type = 'text';
    qty.inputMode = 'decimal';
    qty.className = 'in-qty';
    qty.value = '1';

    var unit = document.createElement('select');
    unit.className = 'in-unit';
    UNITS.forEach(function (u) {
      var o = document.createElement('option');
      o.value = u;
      o.textContent = u;
      unit.appendChild(o);
    });

    var price = document.createElement('input');
    price.type = 'text';
    price.inputMode = 'decimal';
    price.className = 'in-price';

    var sum = document.createElement('span');
    sum.className = 'row-sum';
    sum.textContent = formatMoney(0);

    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn btn-remove';
    del.textContent = '✕';

    tr.appendChild(cell('Наименование', name));
    tr.appendChild(cell('Количество', qty));
    tr.appendChild(cell('Единица', unit));
    var priceCell = cell('', price);
    var priceLabel = priceCell.querySelector('.cell-label');
    priceLabel.appendChild(document.createTextNode('Цена, '));
    var cur = document.createElement('span');
    cur.className = 'cur';
    cur.textContent = currency;
    priceLabel.appendChild(cur);
    tr.appendChild(priceCell);
    tr.appendChild(cell('Сумма', sum, 'cell-sum'));
    tr.appendChild(cell('', del, 'cell-remove'));
    return tr;
  }

  function rowSum(tr) {
    return toNumber(tr.querySelector('.in-qty').value) *
           toNumber(tr.querySelector('.in-price').value);
  }

  function $(id) { return document.getElementById(id); }

  // Все суммы документа (без вывода на экран)
  function compute() {
    var subtotal = 0;
    Array.prototype.forEach.call(rowsEl.children, function (tr) {
      subtotal += rowSum(tr);
    });
    subtotal = Math.round(subtotal);

    var discountPct = Math.min(toNumber($('discount').value), 100);
    var vatPct = toNumber($('vat').value);

    var discount = Math.round(subtotal * discountPct / 100);
    var afterDiscount = subtotal - discount;
    var vat = Math.round(afterDiscount * vatPct / 100);
    return {
      subtotal: subtotal,
      discountPct: discountPct,
      discount: discount,
      afterDiscount: afterDiscount,
      vatPct: vatPct,
      vat: vat,
      total: afterDiscount + vat
    };
  }

  function recalc() {
    Array.prototype.forEach.call(rowsEl.children, function (tr) {
      tr.querySelector('.row-sum').textContent = formatMoney(rowSum(tr));
    });

    var c = compute();
    var subtotal = c.subtotal;
    var discount = c.discount;
    var afterDiscount = c.afterDiscount;
    var vat = c.vat;
    var total = c.total;

    $('subtotal').textContent = formatMoney(subtotal);
    $('discount-amount').textContent = '−' + formatMoney(discount);
    $('after-discount').textContent = formatMoney(afterDiscount);
    $('vat-amount').textContent = formatMoney(vat);
    totalEl.textContent = formatMoney(total);

    $('line-discount').hidden = discount === 0;
    $('line-after').hidden = discount === 0;
    $('line-vat').hidden = vat === 0;

    saveDraft();
  }

  function changeCurrency() {
    currency = $('currency').value;
    Array.prototype.forEach.call(document.querySelectorAll('.cur'), function (el) {
      el.textContent = currency;
    });
    recalc();
  }

  // Подписи для скринридеров с номером позиции
  function relabel() {
    Array.prototype.forEach.call(rowsEl.children, function (tr, i) {
      var n = ' (позиция ' + (i + 1) + ')';
      tr.querySelector('.in-name').setAttribute('aria-label', 'Наименование' + n);
      tr.querySelector('.in-qty').setAttribute('aria-label', 'Количество' + n);
      tr.querySelector('.in-unit').setAttribute('aria-label', 'Единица' + n);
      tr.querySelector('.in-price').setAttribute('aria-label', 'Цена' + n);
      tr.querySelector('.btn-remove').setAttribute('aria-label', 'Удалить позицию ' + (i + 1));
    });
  }

  function addRow(focus) {
    var tr = createRow();
    rowsEl.appendChild(tr);
    relabel();
    recalc();
    if (focus) tr.querySelector('.in-name').focus();
  }

  function removeRow(tr) {
    var next = tr.nextElementSibling || tr.previousElementSibling;
    if (rowsEl.children.length === 1) {
      // Последнюю строку не удаляем, а очищаем.
      tr.querySelector('.in-name').value = '';
      tr.querySelector('.in-qty').value = '1';
      tr.querySelector('.in-unit').selectedIndex = 0;
      tr.querySelector('.in-price').value = '';
      tr.querySelector('.in-name').focus();
    } else {
      rowsEl.removeChild(tr);
      if (next) next.querySelector('.in-name').focus();
    }
    relabel();
    recalc();
  }

  rowsEl.addEventListener('input', recalc);
  $('discount').addEventListener('input', recalc);
  $('vat').addEventListener('input', recalc);
  $('currency').addEventListener('change', changeCurrency);

  rowsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn-remove');
    if (btn) removeRow(btn.closest('tr'));
  });

  // Enter в последней строке добавляет новую позицию.
  rowsEl.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
    var tr = e.target.closest('tr');
    if (tr === rowsEl.lastElementChild) {
      e.preventDefault();
      addRow(true);
    }
  });

  addBtn.addEventListener('click', function () { addRow(true); });

  function titleText() {
    var num = $('number').value.trim();
    var parts = (dateEl.value || '').split('-');
    var date = parts.length === 3 ? parts[2] + '.' + parts[1] + '.' + parts[0] : '';
    return 'Смета' + (num ? ' № ' + num : '') + (date ? ' от ' + date : '');
  }

  // Подготовка печатной версии: заголовок и комментарий
  function preparePrint() {
    $('print-title').textContent = titleText();

    var comment = $('comment').value.trim();
    $('print-comment').textContent = comment;
    $('comment-card').setAttribute('data-empty', comment ? 'false' : 'true');
  }

  $('save-pdf').addEventListener('click', function () {
    preparePrint();
    window.print();
  });
  // Если печать запущена через Ctrl+P
  window.addEventListener('beforeprint', preparePrint);

  // ---------- Черновик в localStorage ----------
  var STORAGE_KEY = 'smeta-draft-v1';
  var loading = true; // пока восстанавливаем, ничего не сохраняем
  var FIELD_IDS = ['from', 'to', 'number', 'date', 'discount', 'vat', 'comment'];

  function saveDraft() {
    if (loading) return;
    try {
      var data = { currency: currency, rows: [] };
      FIELD_IDS.forEach(function (id) { data[id] = $(id).value; });
      Array.prototype.forEach.call(rowsEl.children, function (tr) {
        data.rows.push({
          name: tr.querySelector('.in-name').value,
          qty: tr.querySelector('.in-qty').value,
          unit: tr.querySelector('.in-unit').value,
          price: tr.querySelector('.in-price').value
        });
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) { /* хранилище недоступно — работаем без него */ }
  }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function setCurrency(value) {
    var select = $('currency');
    var known = Array.prototype.some.call(select.options, function (o) {
      return o.value === value;
    });
    select.value = known ? value : '₸';
    currency = select.value;
    Array.prototype.forEach.call(document.querySelectorAll('.cur'), function (el) {
      el.textContent = currency;
    });
  }

  function restoreDraft(data) {
    FIELD_IDS.forEach(function (id) {
      if (typeof data[id] === 'string') $(id).value = data[id];
    });
    setCurrency(data.currency);
    rowsEl.innerHTML = '';
    var rows = Array.isArray(data.rows) ? data.rows : [];
    rows.forEach(function (r) {
      addRow(false);
      var tr = rowsEl.lastElementChild;
      tr.querySelector('.in-name').value = String(r.name == null ? '' : r.name);
      tr.querySelector('.in-qty').value = String(r.qty == null ? '' : r.qty);
      tr.querySelector('.in-price').value = String(r.price == null ? '' : r.price);
      if (UNITS.indexOf(r.unit) !== -1) tr.querySelector('.in-unit').value = r.unit;
    });
    if (rowsEl.children.length === 0) addRow(false);
  }

  // ---------- Новая смета ----------
  function nextNumber(text) {
    var m = String(text).trim().match(/^(.*?)(\d+)$/);
    if (!m) return '1';
    var next = String(Number(m[2]) + 1);
    while (next.length < m[2].length) next = '0' + next; // 009 -> 010
    return m[1] + next;
  }

  function newEstimate() {
    if (!window.confirm('Начать новую смету? Текущие данные будут очищены.')) return;
    loading = true;
    var num = nextNumber($('number').value);
    FIELD_IDS.forEach(function (id) { $(id).value = ''; });
    $('number').value = num;
    dateEl.value = todayISO();
    $('discount').value = '0';
    $('vat').value = '0';
    rowsEl.innerHTML = '';
    hideFallback();
    loading = false;
    addRow(false);
    $('from').focus();
  }

  // ---------- Копирование для WhatsApp ----------
  function plural(n) { // число без лишних нулей, запятая как разделитель
    return String(Math.round(n * 1000) / 1000).replace('.', ',');
  }

  function buildMessage() {
    var lines = [titleText()];
    var from = $('from').value.trim();
    var to = $('to').value.trim();
    if (from) lines.push('От: ' + from);
    if (to) lines.push('Для: ' + to);
    lines.push('');

    Array.prototype.forEach.call(rowsEl.children, function (tr) {
      var name = tr.querySelector('.in-name').value.trim();
      var qty = toNumber(tr.querySelector('.in-qty').value);
      var price = toNumber(tr.querySelector('.in-price').value);
      var unit = tr.querySelector('.in-unit').value;
      var sum = qty * price;
      if (!name && sum === 0) return; // пустую строку не отправляем
      lines.push('• ' + (name || 'Без названия') + ' — ' + plural(qty) + ' ' + unit +
        ' × ' + formatMoney(price) + ' = ' + formatMoney(sum));
    });

    var c = compute();
    lines.push('');
    if (c.discount > 0 || c.vat > 0) lines.push('Сумма: ' + formatMoney(c.subtotal));
    if (c.discount > 0) {
      lines.push('Скидка (' + plural(c.discountPct) + '%): −' + formatMoney(c.discount));
      lines.push('Сумма со скидкой: ' + formatMoney(c.afterDiscount));
    }
    if (c.vat > 0) lines.push('НДС (' + plural(c.vatPct) + '%): ' + formatMoney(c.vat));
    lines.push('Итого к оплате: ' + formatMoney(c.total));

    var comment = $('comment').value.trim();
    if (comment) lines.push('', comment);
    return lines.join('\n');
  }

  var statusTimer = null;
  function showStatus() {
    var el = $('copy-status');
    el.hidden = false;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () { el.hidden = true; }, 2000);
  }

  function hideFallback() {
    $('fallback').hidden = true;
  }

  function showFallback(text) {
    var box = $('fallback-text');
    $('fallback').hidden = false;
    box.value = text;
    box.focus();
    box.select();
  }

  function copyMessage() {
    var text = buildMessage();
    hideFallback();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showStatus, function () {
        showFallback(text);
      });
    } else {
      showFallback(text);
    }
  }

  $('new-estimate').addEventListener('click', newEstimate);
  $('copy-wa').addEventListener('click', copyMessage);

  // Любое изменение полей вне таблицы тоже сохраняется
  ['from', 'to', 'number', 'date', 'comment'].forEach(function (id) {
    $(id).addEventListener('input', saveDraft);
  });
  dateEl.addEventListener('change', saveDraft);

  // ---------- Запуск ----------
  var saved = loadDraft();
  if (saved && typeof saved === 'object') {
    restoreDraft(saved);
  } else {
    dateEl.value = todayISO();
    addRow(false);
  }
  loading = false;
  recalc();
})();
