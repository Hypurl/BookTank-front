const FuzzySet = require('fuzzyset.js')
const app = getApp()
let products
let maxProducts
let searchValue
Component({
  options: {
    addGlobalClass: true
  },
  data: {
    categories: ["School Books", "Prep Books", "Other Books", "Other Items"],
    images: ["school-books.jpg", "prep-books.jpg", "other-books.jpg", "other-items.jpg"],
    currentCard: 0,
    translate: app.globalData.translate
  },
  attached() {
    this.updateData()
  },
  methods: {
    updateData() {
      if (!this.data.includeYear) {
        let includeYear = {}
        let thisYear = new Date().getFullYear()
        for (let i = thisYear; i >= 2019; i--) {
          includeYear[i] = false
        }
        includeYear[thisYear] = true
        this.setData({
          includeYear: includeYear,
          thisYear: thisYear
        })
      }

      let shuffle = a => {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
          j = Math.floor(Math.random() * (i + 1));
          x = a[i];
          a[i] = a[j];
          a[j] = x;
        }
        return a;
      }

      products = this.filterProducts(this.data.categories[this.data.currentCard]).reverse()
      let newProducts = 0
      while (products[newProducts] && (new Date().getTime() - new Date(app.globalData.products[products[newProducts]].date).getTime()) / 1000 / 60 / 60 / 24 < 7) {
        newProducts += 1
      }
      products = products.slice(0, newProducts).concat(shuffle(products.slice(newProducts)))
      maxProducts = 8
      this.setData({
        products: products.slice(0, maxProducts),
        newProducts: newProducts
      })
    },
    selectCategory(event) {
      if (event.target.id && event.target.id != this.data.currentCard) {
        this.setData({
          currentCard: event.target.id
        })
        this.updateData()
      }
    },
    switchCard(event) {
      this.setData({
        currentCard: event.detail.current
      })
      this.updateData()
    },
    filterProducts(category) {
      let includesCategory = (items, category) => {
        for (let itemID of items) {
          if (app.globalData.items[itemID].category == category) {
            return true
          }
        }
        return false
      }

      products = app.globalData.products
      let output = []
      for (let productID of Object.keys(products)) {
        if (products[productID].status == "Selling" && includesCategory(products[productID].items, category) && this.data.includeYear[new Date(products[productID].date).getFullYear()]) {
          output.push(productID)          
        }
      }
      return output
    },
    view(event) {
      wx.navigateTo({
        url: `/pages/browse/product/product?id=${event.currentTarget.dataset.id}`
      })
    },
    search(event) {
      let getSearchData = () => {
        let data = {}
        Object.keys(app.globalData.products).forEach(productID => {
          let product = app.globalData.products[productID]
          if (product.status == "Selling") {
            let temp = `${productID} | ${product.name} | ${app.globalData.users[product.seller].name}`
            product.items.forEach(itemID => {
              let item = app.globalData.items[itemID]
              temp += ` | ${item.name} / ${item.category}`
              if (item.subject) {
                temp += ` / ${item.subject}`
              }
            })
            temp += " "
            let repeat = 1000 - temp.length
            if (repeat > 0) {
              temp += "|".repeat(repeat)
            }
            data[temp] = productID
          }
        })
        return data
      }

      let sortSearchData = (input, data) => {
        if (input.substring(0, 3) == "978") {
          let output = []
          Object.keys(app.globalData.products).forEach(productID => {
            let product = app.globalData.products[productID]
            if (product.status == "Selling") {
              for (let itemID of product.items) {
                if (app.globalData.items[itemID].isbn.indexOf(isbn) != -1) {
                  output.push(productID)
                  break
                }
              }
            }
          })
          return output
        } else {
          let output = []
          let fuzzySet = FuzzySet(Object.keys(data))
          fuzzySet.get(input, [], 0).forEach(element => output.push(data[element[1]]))
          return output
        }
      }

      searchValue = event.detail.value
      this.setData({
        searching: true
      })
      products = sortSearchData(searchValue, getSearchData())
      products = products.filter(productID => this.data.includeYear[new Date(app.globalData.products[productID].date).getFullYear()])
      maxProducts = 8
      this.setData({
        products: products.slice(0, maxProducts)
      })
    },
    showProducts() {
      if (!searchValue) {
        this.setData({
          searching: false
        })
        this.updateData()
      }
    },
    addProducts() {
      maxProducts += 8
      this.setData({
        products: products.slice(0, maxProducts)
      })
    },
    refresh() {
      wx.request({
        method: "POST",
        url: app.globalData.address,
        data: {
          userID: app.globalData.userID,
          action: "getData"
        },
        success: res => {
          app.globalData.users = res.data.users
          app.globalData.products = res.data.products
          app.globalData.items = res.data.items
          app.globalData.messages = res.data.messages
          app.globalData.bookmarks = res.data.bookmarks
          app.globalData.reservations = res.data.reservations
          this.triggerEvent("updateNewMessages")
          if (!this.data.searching) {
            this.updateData()
          }
        },
        complete: () => {
          this.setData({
            refreshing: false
          })
        }
      })
    },
    toggleYear(event) {
      let year = event.currentTarget.dataset.year
      Object.keys(this.data.includeYear).forEach(y => this.data.includeYear[y] = false)
      this.data.includeYear[year] = true

      this.setData({
        includeYear: this.data.includeYear
      })
      if (this.data.searching) {
        let temp = {}
        temp["detail"] = {}
        temp["detail"]["value"] = searchValue
        this.search(temp)
      } else {
        this.updateData()
      }
    }
  }
})