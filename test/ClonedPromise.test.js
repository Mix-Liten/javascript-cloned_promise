const expect = require('chai').expect
const ClonedPromise = require('../ClonedPromise')

// const ClonedPromise = Promise

const DEFAULT_VALUE = 'default'

const promise = ({ value = DEFAULT_VALUE, fail = false } = {}) => {
  return new ClonedPromise((resolve, reject) => {
    fail ? reject(value) : resolve(value)
  })
}

describe('then', () => {
  it('with no chaining', async () => {
    return promise().then(v => expect(v).equal(DEFAULT_VALUE))
  })

  it('with multiple thens for same promise', () => {
    const checkFn = v => expect(v).equal(DEFAULT_VALUE)
    const mainPromise = promise()
    const promise1 = mainPromise.then(checkFn)
    const promise2 = mainPromise.then(checkFn)
    return Promise.allSettled([promise1, promise2])
  })

  it('with then and catch', () => {
    const checkFn = v => expect(v).equal(DEFAULT_VALUE)
    const failFn = _ => expect(1).equal(2)
    const resolvePromise = promise().then(checkFn, failFn)
    const rejectPromise = promise({ fail: true }).then(checkFn, failFn)
    return Promise.allSettled([resolvePromise, rejectPromise])
  })

  it('with chaining', async () => {
    return promise({ value: 3 })
      .then(v => v * 4)
      .then(v => expect(v).equal(12))
  })
})

describe('catch', () => {
  it('with no chaining', async () => {
    return promise({ fail: true }).catch(v => expect(v).equal(DEFAULT_VALUE))
  })

  it('with multiple catchs for same promise', () => {
    const checkFn = v => expect(v).equal(DEFAULT_VALUE)
    const mainPromise = promise({ fail: true })
    const promise1 = mainPromise.catch(checkFn)
    const promise2 = mainPromise.catch(checkFn)
    return Promise.allSettled([promise1, promise2])
  })

  it('with chaining', async () => {
    return promise({ value: 3 })
      .then(v => {
        throw v * 4
      })
      .catch(v => expect(v).equal(12))
  })
})

describe('finally', () => {
  it('with no chaining', async () => {
    const checkFn = v => expect(v).to.be.undefined
    const successPromise = promise().finally(checkFn)
    const failPromise = promise({ fail: true }).finally(checkFn)
    return Promise.allSettled([successPromise, failPromise])
  })

  it('with multiple finallys for same promise', () => {
    const checkFn = v => expect(v).to.be.undefined
    const mainPromise = promise()
    const promise1 = mainPromise.finally(checkFn)
    const promise2 = mainPromise.finally(checkFn)
    return Promise.allSettled([promise1, promise2])
  })

  it('with chaining', async () => {
    const checkFn = v => expect(v).to.be.undefined
    const successPromise = promise()
      .then(v => v)
      .finally(checkFn)
    const failPromise = promise({ fail: true })
      .then(v => v)
      .finally(checkFn)
    return Promise.allSettled([successPromise, failPromise])
  })
})

describe('static methods', () => {
  it('resolve', async () => {
    return ClonedPromise.resolve(DEFAULT_VALUE).then(v => expect(v).equal(DEFAULT_VALUE))
  })

  it('reject', async () => {
    return ClonedPromise.reject(DEFAULT_VALUE).catch(v => expect(v).equal(DEFAULT_VALUE))
  })

  describe('all', () => {
    it('with success', async () => {
      return ClonedPromise.all([promise({ value: 1 }), promise({ value: 2 })]).then(v => expect(v).to.eql([1, 2]))
    })

    it('with fail', async () => {
      return ClonedPromise.all([promise(), promise({ fail: true })]).catch(v => expect(v).equal(DEFAULT_VALUE))
    })
  })

  it('allSettled', async () => {
    return ClonedPromise.allSettled([promise(), promise({ fail: true })]).then(v =>
      expect(v).to.eql([
        { status: 'fulfilled', value: DEFAULT_VALUE },
        { status: 'rejected', reason: DEFAULT_VALUE },
      ])
    )
  })

  describe('race', () => {
    it('with success', async () => {
      return ClonedPromise.race([promise({ value: 1 }), promise({ value: 2 })]).then(v => expect(v).equal(1))
    })

    it('with fail', async () => {
      return ClonedPromise.race([promise({ value: 1, fail: true }), promise({ value: 2, fail: true })]).catch(v =>
        expect(v).equal(1)
      )
    })
  })

  describe('any', () => {
    it('with success', async () => {
      return ClonedPromise.any([promise({ value: 1, fail: true }), promise({ value: 2 })]).then(v => expect(v).equal(2))
    })

    it('with fail', async () => {
      return ClonedPromise.any([promise({ value: 1, fail: true }), promise({ value: 3, fail: true })]).catch(e => {
        return expect(e.errors).to.eql([1, 3])
      })
    })
  })
})
