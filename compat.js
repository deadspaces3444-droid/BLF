// ===== BLF — проверка совместимости компонентов =====
// parts: { cpu, gpu, motherboard, ram, ssd, psu, case, cooling } — id компонентов
// Возвращает { status: 'ok'|'warn'|'error', issues: [{level, title, desc, fix}] }

function checkCompatibility(parts) {
  const get = k => parts[k] ? byId(parts[k]) : null;
  const cpu = get('cpu'), gpu = get('gpu'), mb = get('motherboard'),
        ram = get('ram'), ssd = get('ssd'), psu = get('psu'),
        kase = get('case'), cool = get('cooling');
  const issues = [];
  const add = (level, title, desc, fix) => issues.push({ level, title, desc, fix });

  // 1. Сокет CPU ↔ материнская плата
  if (cpu && mb) {
    if (cpu.specs.socket !== mb.specs.socket) {
      add('error', 'Сокет не совпадает',
        `Процессор ${cpu.name} (${cpu.specs.socket}) не встанет в плату ${mb.name} (${mb.specs.socket}).`,
        `Выберите плату с сокетом ${cpu.specs.socket}.`);
    } else {
      add('ok', 'Сокет совпадает', `${cpu.specs.socket} — процессор и плата совместимы.`);
    }
  }

  // 2. Тип памяти DDR3/DDR4/DDR5 (учитываем ECC/REG-варианты серверных платформ)
  if (ram && mb) {
    const baseType = t => String(t || '').replace(/\s*(ECC|REG)\b/g, '').replace(/\s+/g, ' ').trim();
    const ramT = ram.specs.type, mbT = mb.specs.ramType;
    if (baseType(ramT) !== baseType(mbT)) {
      add('error', 'Тип памяти не совпадает',
        `Память ${ram.name} — ${ramT}, а плата ${mb.name} поддерживает ${mbT}.`,
        `Подберите память ${mbT} или плату под ${ramT}.`);
    } else if (/ECC|REG/.test(mbT) && !/ECC|REG/.test(ramT)) {
      add('warn', 'Серверной плате нужна ECC/REG-память',
        `${mb.name} рассчитана на ${mbT}; обычная ${ramT} может не заработать.`,
        `Возьмите модули ${mbT}.`);
    } else {
      add('ok', 'Тип памяти совпадает', `${ramT} — плата поддерживает.`);
    }
  }

  // 3. Объём памяти и слоты
  if (ram && mb) {
    const cap = parseInt(String(mb.specs.maxRam).replace(/\D/g, ''), 10);
    if (ram.specs.capacityGb > cap) {
      add('error', 'Слишком большой объём памяти',
        `${ram.specs.capacityGb} ГБ > максимума платы ${mb.specs.maxRam}.`,
        'Возьмите комплект меньшего объёма.');
    }
    if (ram.specs.modules > mb.specs.ramSlots) {
      add('error', 'Не хватает слотов памяти',
        `Комплект из ${ram.specs.modules} модулей, а на плате ${mb.specs.ramSlots} слотов.`,
        'Возьмите комплект с меньшим числом модулей.');
    }
  }

  // 4. Мощность блока питания
  if (cpu && gpu && psu) {
    const total = cpu.specs.tdp + gpu.specs.tdp + 90;
    const recommended = Math.round(total * 1.3 / 10) * 10;
    const watt = psu.specs.wattage;
    if (watt < total) {
      add('error', 'Блок питания слишком слабый',
        `Потребление системы ≈ ${total} Вт, а блок ${psu.name} — ${watt} Вт. Возможны выключения и повреждение железа.`,
        `Возьмите блок от ${recommended} Вт.`);
    } else if (watt < recommended) {
      add('warn', 'Блок питания на грани',
        `Потребление ≈ ${total} Вт, блок — ${watt} Вт. Рекомендуется запас 30%: от ${recommended} Вт.`,
        'Для тихой работы и разгона возьмите блок мощнее.');
    } else {
      add('ok', 'Мощность БП достаточна', `Потребление ≈ ${total} Вт, блок ${watt} Вт — запас ${Math.round((watt - total) / total * 100)}%.`);
    }
    if (gpu.specs.recommendedPsu && watt < gpu.specs.recommendedPsu) {
      add('warn', 'Рекомендация производителя видеокарты',
        `${gpu.name} требует БП от ${gpu.specs.recommendedPsu} Вт.`,
        `Возьмите блок от ${gpu.specs.recommendedPsu} Вт.`);
    }
    if (gpu.specs.tdp >= 300 && String(psu.specs.pcie5 || '').startsWith('Нет')) {
      add('warn', 'Нет разъёма 12VHPWR',
        'Мощная видеокарта требует питания 12VHPWR — проверьте наличие переходника.',
        'Возьмите БП с поддержкой PCIe 5.0.');
    }
  }

  // 5. Длина видеокарты ↔ корпус
  if (gpu && kase) {
    if (gpu.specs.lengthMm > kase.specs.maxGpuLengthMm) {
      add('error', 'Видеокарта не помещается в корпус',
        `${gpu.name} — ${gpu.specs.lengthMm} мм, корпус ${kase.name} — до ${kase.specs.maxGpuLengthMm} мм.`,
        'Возьмите корпус с большей поддержкой длины видеокарты.');
    } else {
      add('ok', 'Видеокарта помещается', `${gpu.specs.lengthMm} мм ≤ ${kase.specs.maxGpuLengthMm} мм.`);
    }
  }

  // 6. Высота кулера ↔ корпус + мощность охлаждения
  if (cool && kase && cool.specs.type === 'Воздух') {
    if (cool.specs.heightMm > kase.specs.maxCpuCoolerHeightMm) {
      add('error', 'Кулер не помещается в корпус',
        `${cool.name} — ${cool.specs.heightMm} мм, корпус — до ${kase.specs.maxCpuCoolerHeightMm} мм.`,
        'Возьмите кулер ниже или корпус выше.');
    } else {
      add('ok', 'Кулер помещается', `${cool.specs.heightMm} мм ≤ ${kase.specs.maxCpuCoolerHeightMm} мм.`);
    }
  }
  if (cool && cpu) {
    if (cool.specs.tdpSupport < cpu.specs.tdp) {
      add('error', 'Охлаждение слабое для процессора',
        `${cool.name} рассчитан на ${cool.specs.tdpSupport} Вт, а ${cpu.name} — ${cpu.specs.tdp} Вт TDP.`,
        'Возьмите более производительное охлаждение.');
    } else if (cool.specs.tdpSupport < cpu.specs.tdp * 1.3) {
      add('warn', 'Охлаждение на грани',
        'Запас по TDP меньше 30% — в нагрузке возможны высокие температуры.',
        'Для разгона и тишины возьмите кулер мощнее.');
    } else {
      add('ok', 'Охлаждение достаточно', `Запас по TDP: ${Math.round((cool.specs.tdpSupport - cpu.specs.tdp) / cpu.specs.tdp * 100)}%.`);
    }
  }

  // 7. Форм-фактор платы ↔ корпус
  if (mb && kase) {
    const supported = String(kase.specs.motherboardSupport).split(',').map(s => s.trim());
    const ff = mb.specs.formFactor;
    const ok = supported.includes(ff) || (ff === 'mATX' && supported.includes('ATX')) || (ff === 'ITX' && (supported.includes('mATX') || supported.includes('ATX')));
    if (!ok) {
      add('error', 'Плата не помещается в корпус',
        `${mb.name} (${ff}), а корпус ${kase.name} поддерживает: ${kase.specs.motherboardSupport}.`,
        'Возьмите корпус под этот форм-фактор.');
    } else {
      add('ok', 'Форм-фактор платы подходит', `${ff} поддерживается корпусом.`);
    }
  }

  // 8. Накопитель ↔ плата (M.2 / SATA)
  if (ssd && mb) {
    if (ssd.specs.type === 'NVMe' && mb.specs.m2Slots === 0) {
      add('error', 'Нет слота M.2',
        `${ssd.name} — NVMe, а на плате ${mb.name} нет слотов M.2.`,
        'Возьмите SATA-накопитель или плату с M.2.');
    } else if (ssd.specs.type === 'SATA' && mb.specs.sataPorts === 0) {
      add('error', 'Нет портов SATA',
        'На плате нет свободных портов SATA.',
        'Возьмите NVMe-накопитель.');
    } else {
      add('ok', 'Накопитель подключается', `${ssd.specs.interface} — плата поддерживает.`);
    }
  }

  // 9. Поколение чипсета / BIOS (предупреждение)
  if (cpu && mb) {
    const cpuGen = String(cpu.specs.gen || '');
    const mbGen = String(mb.specs.gen || '');
    if (cpu.specs.socket === 'LGA1700' && /14-е/.test(cpuGen) && !/14-е/.test(mbGen)) {
      add('warn', 'Нужна обновлённая версия BIOS',
        'Процессоры 14-го поколения на платах B660/H610 требуют обновления BIOS.',
        'Обновите BIOS перед установкой или выберите плату B760/Z790.');
    }
    if (cpu.specs.socket === 'AM4' && /5000/.test(cpuGen) && !/5000/.test(mbGen)) {
      add('warn', 'Нужна обновлённая версия BIOS',
        'Процессоры Ryzen 5000 на платах B450/X470 требуют обновления BIOS.',
        'Обновите BIOS или выберите плату B550/X570.');
    }
    if (cpu.specs.socket === 'LGA1151' && /9-е/.test(cpuGen) && /6\/7/.test(mbGen)) {
      add('warn', 'Нужна обновлённая версия BIOS',
        'Процессоры 9-го поколения на платах B250/H110 требуют обновления BIOS.',
        'Обновите BIOS или выберите плату B360/Z390.');
    }
    if (cpu.specs.socket === 'LGA1200' && /11-е/.test(cpuGen) && !/11-е/.test(mbGen)) {
      add('warn', 'Нужна обновлённая версия BIOS',
        'Процессоры 11-го поколения на платах B460 требуют обновления BIOS.',
        'Обновите BIOS или выберите плату B560/Z590.');
    }
    if (cpu.specs.socket === 'AM4' && /3000/.test(cpuGen) && /1000\/2000/.test(mbGen)) {
      add('warn', 'Нужна обновлённая версия BIOS',
        'Процессоры Ryzen 3000 на платах B350/X370 требуют обновления BIOS.',
        'Обновите BIOS или выберите плату B450/B550.');
    }
  }

  // 10. Версия PCIe (предупреждение о потере производительности)
  if (gpu && mb) {
    const gpuPcie = String(gpu.specs.pcie || '');
    const mbPcie = String(mb.specs.pcie || '');
    const gpuVer = /PCIe 5/.test(gpuPcie) ? 5 : /PCIe 4/.test(gpuPcie) ? 4 : /PCIe 3/.test(gpuPcie) ? 3 : 2;
    const mbVer = /PCIe 5/.test(mbPcie) ? 5 : /PCIe 4/.test(mbPcie) ? 4 : /PCIe 3/.test(mbPcie) ? 3 : 2;
    if (gpuVer > mbVer) {
      const loss = gpuVer - mbVer >= 2 ? 'до 10–15%' : 'до 5–10%';
      add('warn', `Слот PCIe ${mbVer}.0 вместо ${gpuVer}.0`,
        `Видеокарта поддерживает PCIe ${gpuVer}.0, но плата — только PCIe ${mbVer}.0. Потеря производительности ${loss}.`,
        'Для максимума возьмите плату с более новым PCIe.');
    }
  }

  // 11. Старая платформа: DDR3 / HDD — предупреждение о скорости
  if (ram && ram.specs.type === 'DDR3') {
    add('warn', 'Старая память DDR3',
      'Платформа DDR3 заметно медленнее современных DDR4/DDR5 в играх и работе.',
      'Если собираете с нуля — берите платформу DDR4/DDR5.');
  }
  if (ssd && ssd.specs.type === 'HDD') {
    add('warn', 'Жёсткий диск (HDD) вместо SSD',
      'HDD в разы медленнее SSD: долгие загрузки игр и системы.',
      'Добавьте SSD (хотя бы 240 ГБ) под систему и игры.');
  }

  const hasError = issues.some(i => i.level === 'error');
  const hasWarn = issues.some(i => i.level === 'warn');
  return { status: hasError ? 'error' : hasWarn ? 'warn' : 'ok', issues };
}
