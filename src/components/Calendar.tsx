import type { CalendarMap, Page } from '../types.js'

interface CalendarProps {
  calendarMap: CalendarMap
  currentYearMonth: string
}

function parseYM(ym: string): { year: number; month: number } {
  const [y, m] = ym.split('-').map(Number)
  return { year: y, month: m }
}

function formatYM(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function firstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}

function buildDayMap(pages: Page[]): Map<number, Page[]> {
  const map = new Map<number, Page[]>()
  for (const page of pages) {
    const d = page.frontmatter.createDateTime.getDate()
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(page)
  }
  return map
}

function CalendarMonth({
  ym,
  calendarMap,
  isVisible,
}: {
  ym: string
  calendarMap: CalendarMap
  isVisible: boolean
}) {
  const { year, month } = parseYM(ym)
  const pages = calendarMap.get(ym) ?? []
  const dayMap = buildDayMap(pages)
  const totalDays = daysInMonth(year, month)
  const startDow = firstDayOfWeek(year, month)

  const cells: (number | null)[] = [...Array(startDow).fill(null)]
  for (let d = 1; d <= totalDays; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return (
    <div
      class="calendar-month"
      data-ym={ym}
      style={isVisible ? undefined : 'display:none'}
      aria-hidden={isVisible ? undefined : 'true'}
    >
      <table class="calendar-table">
        <caption class="calendar-caption">
          {year}年{month}月
        </caption>
        <thead>
          <tr>
            {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
              <th key={d} class="calendar-dow" scope="col">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) => {
                if (day === null) {
                  return <td key={di} class="calendar-cell calendar-cell--empty" />
                }
                const dayPages = dayMap.get(day) ?? []
                const hasArticles = dayPages.length > 0
                const dateStr = `${ym}-${String(day).padStart(2, '0')}`
                const href =
                  dayPages.length === 1
                    ? dayPages[0].url
                    : `/date/${dateStr}/`
                return (
                  <td key={di} class={`calendar-cell${hasArticles ? ' calendar-cell--has-article' : ''}`}>
                    {hasArticles ? (
                      <a href={href} class="calendar-day-link">
                        {day}
                      </a>
                    ) : (
                      <span class="calendar-day">{day}</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Calendar({ calendarMap, currentYearMonth }: CalendarProps) {
  if (calendarMap.size === 0) return null

  const allMonths = [...calendarMap.keys()].sort()

  return (
    <section class="calendar" aria-label="カレンダー">
      <div class="calendar-nav">
        <button class="calendar-nav__btn" id="cal-prev" aria-label="前月">
          &#8249;
        </button>
        <span class="calendar-nav__label" id="cal-label" />
        <button class="calendar-nav__btn" id="cal-next" aria-label="次月">
          &#8250;
        </button>
      </div>
      <div class="calendar-body" id="cal-body" data-current={currentYearMonth}>
        {allMonths.map((ym) => (
          <CalendarMonth
            key={ym}
            ym={ym}
            calendarMap={calendarMap}
            isVisible={ym === currentYearMonth}
          />
        ))}
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){
  var body=document.getElementById('cal-body');
  var label=document.getElementById('cal-label');
  var months=[].slice.call(body.querySelectorAll('[data-ym]')).map(function(el){return el.dataset.ym;});
  var cur=months.indexOf(body.dataset.current);
  function show(i){
    if(i<0||i>=months.length)return;
    months.forEach(function(ym,idx){
      var el=body.querySelector('[data-ym="'+ym+'"]');
      if(idx===i){el.style.display='';el.removeAttribute('aria-hidden');}
      else{el.style.display='none';el.setAttribute('aria-hidden','true');}
    });
    var parts=months[i].split('-');
    label.textContent=parts[0]+'年'+parseInt(parts[1],10)+'月';
    cur=i;
  }
  document.getElementById('cal-prev').addEventListener('click',function(){show(cur-1);});
  document.getElementById('cal-next').addEventListener('click',function(){show(cur+1);});
  show(cur);
})();`,
        }}
      />
    </section>
  )
}
