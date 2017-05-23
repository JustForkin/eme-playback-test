
Results = (() => {
  let needsRender = false
  const $container = document.getElementById('results')
  const dataByType = {}
  function calcRunningAverage(prevAverage, value, index) {
    return (prevAverage * (index - 1) + value) / index
  }
  function formatValueMS(value) {
    return value.toFixed(3) + 'ms'
  }
  function update() {
    requestAnimationFrame(update)
    if (needsRender) {
      needsRender = false
      render()
    }
  }
  function render() {
    for (let key in dataByType) {
      const data = dataByType[key]
      data.$max.innerText = formatValueMS(data.max)
      data.$average.innerText = formatValueMS(data.average)
      data.$last.innerText = formatValueMS(data.last)
    }
  }
  const api = {
    add(type, latency) {
      if (!dataByType[type]) {
        const $col = document.createElement('div')
        const $label = document.createElement('div')
        const $max = document.createElement('div')
        const $average = document.createElement('div')
        const $last = document.createElement('div')
        $col.className = 'col'
        $label.className = 'row'
        $max.className = 'row'
        $average.className = 'row'
        $last.className = 'row'
        $label.innerText = type
        $col.appendChild($label)
        $col.appendChild($max)
        $col.appendChild($average)
        $col.appendChild($last)
        $container.appendChild($col)
        dataByType[type] = {
          count: 0,
          max: 0,
          average: 0,
          last: 0,
          $max,
          $average,
          $last,
        }
      }
      const data = dataByType[type]
      data.max = Math.max(data.max, latency)
      data.average = calcRunningAverage(data.average, latency, data.count + 1)
      data.last = latency
      data.count++
      needsRender = true
    }
  }
  update()
  return api
})()
