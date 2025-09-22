/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js"
import mockStore from "../__mocks__/store"
import usersTest from "../constants/usersTest.js"

import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBe(true)
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe("When I use Bills container", () => {
    test("Then it should work", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const billsContainer = new Bills({
        document, 
        onNavigate: jest.fn(), 
        store: mockStore, 
        localStorage: localStorageMock
      })
      expect(billsContainer).toBeTruthy()
    })

    test("Then handleClickNewBill should work", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const onNavigate = jest.fn()
      const billsContainer = new Bills({
        document, 
        onNavigate, 
        store: mockStore, 
        localStorage: localStorageMock
      })
      
      billsContainer.handleClickNewBill()
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill'])
    })

    test("Then getBills should work", async () => {
      const billsContainer = new Bills({
        document, 
        onNavigate: jest.fn(), 
        store: mockStore, 
        localStorage: localStorageMock
      })
      
      const result = await billsContainer.getBills()
      expect(result).toBeTruthy()
    })

    test("Then getBills should handle corrupted data", async () => {
      const mockStoreWithError = {
        bills: () => ({
          list: () => Promise.resolve([
            { date: 'invalid-date', status: 'pending' }
          ])
        })
      }
      
      const billsContainer = new Bills({
        document, 
        onNavigate: jest.fn(), 
        store: mockStoreWithError, 
        localStorage: localStorageMock
      })
      
      const result = await billsContainer.getBills()
      expect(result).toBeTruthy()
    })
  })
})

// Test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("Then it fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: usersTest[0] }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      expect(screen.getByTestId("tbody")).toBeTruthy()
    })

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: usersTest[1]
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })

      test("Then it fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }})
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      test("Then it fetches bills from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }})
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})
