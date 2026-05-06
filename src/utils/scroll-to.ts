const easeInOutQuad = function (t: number, b: number, c: number, d: number) {
    t /= d / 2
    if (t < 1) {
        return (c / 2) * t * t + b
    }
    t--
    return (-c / 2) * (t * (t - 2) - 1) + b
}


const requestAnimFrame = (function () {
    return (
        window.requestAnimationFrame ||
        (window as any).webkitRequestAnimationFrame ||
        (window as any).mozRequestAnimationFrame ||
        function (callback: FrameRequestCallback) {
            window.setTimeout(callback, 1000 / 60)
        }
    )
})()





function move(amount: number) {
    document.documentElement.scrollTop = amount
    ;(document.body.parentNode as any).scrollTop = amount
    document.body.scrollTop = amount
}

function position() {
    return document.documentElement.scrollTop || (document.body.parentNode as any).scrollTop || document.body.scrollTop
}






export function scrollTo(to: number, duration: number, callback?: () => any) {
    const start = position()
    const change = to - start
    const increment = 20
    let currentTime = 0
    duration = typeof duration === 'undefined' ? 500 : duration
    const animateScroll = function () {
        
        currentTime += increment
        
        const val = easeInOutQuad(currentTime, start, change, duration)
        
        move(val)
        
        if (currentTime < duration) {
            requestAnimFrame(animateScroll)
        } else {
            if (callback && typeof callback === 'function') {
                
                callback()
            }
        }
    }
    animateScroll()
}
