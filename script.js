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

  // 15000 -> "15 000 ₸"
  function formatMoney(value) {
    var n = isFinite(value) ? Math.round(value * 100) / 100 : 0;
    var parts = n.toFixed(2).replace(/\.?0+$/, '').split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join('.') + ' ₸';
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
    tr.appendChild(cell('Цена, ₸', price));
    tr.appendChild(cell('Сумма', sum, 'cell-sum'));
    tr.appendChild(cell('', del, 'cell-remove'));
    return tr;
  }

  function rowSum(tr) {
    return toNumber(tr.querySelector('.in-qty').value) *
           toNumber(tr.querySelector('.in-price').value);
  }

  function recalc() {
    var total = 0;
    Array.prototype.forEach.call(rowsEl.children, function (tr) {
      var s = rowSum(tr);
      tr.querySelector('.row-sum').textContent = formatMoney(s);
      total += s;
    });
    totalEl.textContent = formatMoney(total);
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

  dateEl.value = todayISO();
  addRow(false);
})();
