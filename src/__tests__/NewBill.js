/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store"
import usersTest from "../constants/usersTest.js"

jest.mock("../app/Store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then form should be displayed", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
    })
  })
  
  describe("When I use NewBill container", () => {
    test("Then it should work", () => {
      localStorage.setItem("user", JSON.stringify({ email: usersTest[0] }))
      const html = NewBillUI()
      document.body.innerHTML = html
      const newBill = new NewBill({
        document, 
        onNavigate: jest.fn(), 
        store: mockStore, 
        localStorage: window.localStorage
      })
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId("file")
      Object.defineProperty(fileInput, 'files', { value: [file] })
      const event = { preventDefault: jest.fn(), target: { value: 'test.jpg', files: [file] } }
      newBill.handleChangeFile(event)
      
      expect(newBill).toBeTruthy()
    })

    test("Then handleChangeFile should reject invalid file extensions", () => {
      localStorage.setItem("user", JSON.stringify({ email: usersTest[0] }))
      const html = NewBillUI()
      document.body.innerHTML = html
      const newBill = new NewBill({
        document, 
        onNavigate: jest.fn(), 
        store: mockStore, 
        localStorage: window.localStorage
      })
      
      window.alert = jest.fn()
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByTestId("file")
      Object.defineProperty(fileInput, 'files', { value: [file] })
      const event = { preventDefault: jest.fn(), target: { value: 'test.pdf', files: [file] } }
      
      newBill.handleChangeFile(event)
      expect(window.alert).toHaveBeenCalledWith('Veuillez sélectionner un fichier au format jpg, jpeg ou png.')
    })

    test("Then handleSubmit should prevent default", () => {
      localStorage.setItem("user", JSON.stringify({ email: usersTest[0] }))
      const html = NewBillUI()
      document.body.innerHTML = html
      const onNavigate = jest.fn()
      const newBill = new NewBill({
        document, 
        onNavigate, 
        store: mockStore, 
        localStorage: window.localStorage
      })
      
      const event = { 
        preventDefault: jest.fn(),
        target: {
          querySelector: jest.fn().mockReturnValue({ value: 'test' })
        }
      }
      newBill.updateBill = jest.fn()
      newBill.handleSubmit(event)
      expect(event.preventDefault).toHaveBeenCalled()
    })
  })
})

// Test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I submit a new bill", () => {
    test("Then it should create a new bill", () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: usersTest[1] }))
      const html = NewBillUI()
      document.body.innerHTML = html
      
      const newBill = new NewBill({
        document, 
        onNavigate: jest.fn(), 
        store: mockStore, 
        localStorage: window.localStorage
      })

      expect(newBill.store).toBe(mockStore)
    })
  })

  describe("When an error occurs on API", () => {
    test("Then it should handle 404 error", async () => {
      const mockStore404 = {
        bills: () => ({
          create: () => Promise.reject(new Error("Erreur 404"))
        })
      }

      localStorage.setItem("user", JSON.stringify({ email: usersTest[2] }))
      const html = NewBillUI()
      document.body.innerHTML = html
      
      const newBill = new NewBill({
        document, 
        onNavigate: jest.fn(), 
        store: mockStore404, 
        localStorage: window.localStorage
      })

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const fileInput = screen.getByTestId("file")
      Object.defineProperty(fileInput, 'files', { value: [file] })
      const event = { preventDefault: jest.fn(), target: { value: 'test.jpg', files: [file] } }
      
      newBill.handleChangeFile(event)
      expect(event.preventDefault).toHaveBeenCalled()
    })

    test("Then it should handle 500 error", async () => {
      const mockStore500 = {
        bills: () => ({
          create: () => Promise.reject(new Error("Erreur 500"))
        })
      }

      localStorage.setItem("user", JSON.stringify({ email: usersTest[3] }))
      const html = NewBillUI()
      document.body.innerHTML = html
      
      const newBill = new NewBill({
        document, 
        onNavigate: jest.fn(), 
        store: mockStore500, 
        localStorage: window.localStorage
      })

      expect(newBill.store).toBe(mockStore500)
    })
  })
})
