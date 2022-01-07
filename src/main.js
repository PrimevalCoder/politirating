import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'
import politiratingAbi from '../contract/politicians-popularity.abi.json'
import erc20Abi from "../contract/erc20.abi.json"
import css from "../src/star-rating-svg.css"
import {caddr_politirating, votingPrice, caddr_cUSD, addr_owner, ERC20_DECIMALS} from "./utils/constants";


let kit
let contract
let politicians = [], politiciansLength
let userRating = {} // use object as fake associative array

var eMain = document.getElementById("politicians-main"),
    divAddNew = document.getElementById("divAddPolitician")

const connectCeloWallet = async function () {
    if (window.celo) {
      try {
        notification("⚠️ Please approve this DApp to use it.")
        await window.celo.enable()
        notificationOff()
        const web3 = new Web3(window.celo)
        kit = newKitFromWeb3(web3)
  
        const accounts = await kit.web3.eth.getAccounts()
        kit.defaultAccount = accounts[0]
        if(accounts[0] !== addr_owner) {    // only the owner sees the "Add New Politician" button
          divAddNew.style.visibility = 'hidden'
        }
  
        contract = new kit.web3.eth.Contract(politiratingAbi, caddr_politirating)
      } catch (error) {
        notification(`⚠️ ${error}.`)
      }
    } else {
      notification("⚠️ Please install the CeloExtensionWallet.")
    }
  }

  async function approve() {
    const cUSDContract = new kit.web3.eth.Contract(erc20Abi, caddr_cUSD)
  
   return await cUSDContract.methods
      .approve(caddr_politirating, votingPrice)
      .send({ from: kit.defaultAccount })

  }

  const getBalance = async function () {
    const totalBalance = await kit.getTotalBalance(kit.defaultAccount)
    document.querySelector("#balance").textContent  = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2)

  }

  const getPoliticians = async function() {
      politiciansLength = await contract.methods.getPoliticiansLength().call()
      const _politicians = []
      for (let i = 0; i < politiciansLength; i++) {
        let _politician = new Promise(async (resolve) => {
          let p = await contract.methods.getPolitician(i).call()
          let uv = await contract.methods.getUserRating(i).call()
          resolve({
            index: i,
            fullName: p[0],
            party: p[1],
            shortBio: p[2],
            imageURL: p[3],
            ratingsCount: p[4],
            avgRating: p[5]/100,
            userVote: Math.floor( uv/100 )  // existing user vote for given politician; used to show the star rating accordingly
          })
        })
        _politicians.push(_politician)
      }
      politicians = await Promise.all(_politicians)
      renderPoliticians()
  }

  function renderPoliticians() {
    eMain.innerHTML = ""
    politicians.forEach((_politician) => {
      const newDiv = document.createElement("div")
      newDiv.className = "col-md-4"
      newDiv.innerHTML = politicianCardTemplate(_politician)
      eMain.appendChild(newDiv)
    })

    $(".politician-star-rating").each(function() { // add star ratings to all politician cards
      var inp = $(this).next()
      let pidx = inp.val()
      $(this).starRating({
        starSize: 25,
        initialRating: politicians.find(x => x.index.toString() === pidx).userVote,
        disableAfterRate: false,
        useFullStars: true,
        callback: function(currentRating, $el){
            userRating[pidx] = currentRating
        }
    });
    })
  }

  function politicianCardTemplate(_politician) {
    return `
      <div class="card mb-4">
        <img class="card-img-top" src="${_politician.imageURL}" alt="...">
        <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
          Avg. rating: ${_politician.avgRating} / 5
        </div>
        <div class="card-body text-left p-4 position-relative">
          <h2 class="card-title fs-4 fw-bold mt-2">${_politician.fullName}</h2>
          <p class="card-text mb-4" style="min-height: 82px">
            ${_politician.shortBio}             
          </p>
          <p class="card-text mt-4">
            <i class="bi bi-building"></i>
            <span>${_politician.party}</span>
          </p>
          <div class="mb-3">
          <p class="fs-5 font-weight-bold"><span style="color: red">${_politician.ratingsCount}</span> votes</p>
          </div>
          <div class="mb-3">
          <p class="fs-5">Your rating:</p>
          <div class="politician-star-rating"></div>
          <input type="hidden" name="pid" value="${_politician.index}" />
          </div>
          <div class="d-grid gap-2">
            <a class="btn btn-lg btn-outline-dark btnVote fs-6 p-3" id=${
              _politician.index
            }>
              Vote
            </a>
          </div>
        </div>
      </div>
    `
  }
  
  function notification(_text) {
    document.querySelector(".alert").style.display = "block"
    document.querySelector("#notification").textContent = _text
  }
  
  function notificationOff() {
    document.querySelector(".alert").style.display = "none"
  }

  window.addEventListener('load', async () => {
    notification("⌛ Loading...")
    await connectCeloWallet()
    await getBalance()
    await getPoliticians()
    notificationOff()
  });

  document
  .querySelector("#btnNewPolitician")
  .addEventListener("click", async () => {
    const params = [
      document.getElementById("npFullName").value,
      document.getElementById("npParty").value,
      document.getElementById("npShortBio").value,
      document.getElementById("npImgUrl").value
    ]
    notification(`⌛ Adding "${params[0]}"...`)
    try {
       await contract.methods
        .addPolitician(...params)
        .send({ from: kit.defaultAccount })
    } catch (error) {
      notification(`⚠️ ${error}.`)
    }
    notification(`🎉 You successfully added "${params[0]}".`)
    getPoliticians()
  })

  $("#politicians-main").click(async (e) => {

    var _target = $(e.target) 
    if(_target.hasClass("btnVote")) {
      const index = e.target.id
      notification("⌛ Waiting for payment approval...")
      try {
        await approve()
      } catch (error) {
        notification(`⚠️ ${error}.`)
      }
          notification(`⌛ Awaiting payment to register vote for "${politicians[index].fullName}"...`)
      try {
        console.log(index, userRating[ index.toString() ])
         await contract.methods
          .ratePolitician(index, userRating[ index.toString() ])
          .send({ from: kit.defaultAccount })
        notification(`🎉 You successfully voted for "${politicians[index].fullName}".`)
        getPoliticians()
        getBalance()
      } catch (error) {
        notification(`⚠️ ${error}.`)
      }
    }
  })
