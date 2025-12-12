const Web3Utils = require('web3-utils');
const fetch = require("node-fetch");
const BN = require('bignumber.js');

// 공통 모듈 정의 class
module.exports = class Common {
	constructor(constants){ // 상위단에서 선헌한 상수들을 인자로 받는다.
		this.constants = constants; // constants 내부함수로 선언
	}
	// gasprice.poa.network 가스 조회
	async getGasPrice(){
		var returnData = await fetch('https://gasprice.poa.network/').then((response) => {
			return response.json()
		}).then((data) => {
			return data;
		}).catch((e) => {
			console.error(e)
		})
		return returnData;
	}
	
	// address 의 ether balance 조회
	async getEthBalance(web3Instance, address) { // getWeb3 로 정의한 web3Instance 를 받아서 쓴다.
		try {
			let ethBalance =  await web3Instance.eth.getBalance(address); // 이더 조회
			ethBalance = Web3Utils.fromWei(ethBalance); // wei 를 이더 단위로 바꾸고
			ethBalance = new BN(ethBalance).toFormat(5); // 소숫점 길어질수 있으니 5자리만
			return await parseFloat(ethBalance); // casting 후 return
		}catch(e){
			console.error(e);
			throw '이더 잔고 호출에 실패함.';
		}
	}
	
	// tokenAddress 의 기본정보 조회
	async getTokenInfo(web3Instance, tokenAddress) { // getWeb3 로 정의한 web3Instance 를 받아서 쓴다.
		try{
			const token = new web3Instance.eth.Contract(this.constants.ERC20ABI, tokenAddress); // token contract 호출
			return { // return 값 정의
				name	: await token.methods.name().call(), // token contract의 name 호출
				symbol	: await token.methods.symbol().call(), // token contract의 symbol 호출
				decimal : await token.methods.decimals().call(), // token contract의 decimals 호출
			}
		} catch(e){
			console.log(e);
			throw 'error!';
		}
	}
	
	// token balance 조회
	async getTokenBalance(web3Instance, token, address) { // getWeb3 로 정의한 web3Instance 를 받아서 쓴다.
		try {
			const token_ = new web3Instance.eth.Contract(this.constants.ERC20ABI, token); // token contract 호출
			return await token_.methods.balanceOf(address).call(); // token contract의 balanceOf() 호출 하여 리턴
		}catch(e){
			console.error(e);
			throw 'token 잔고 호출 실패.';
		}
	}
	
	// address 의 nonce 를 조회한다.
	async getSenderNonce(web3Instance, address) { // getWeb3 로 정의한 web3Instance 를 받아서 쓴다.
		try {
			let nonce = await web3Instance.eth.getTransactionCount(address); // web3 getTransactionCount 함수 사용
			return nonce; // 결과값 리턴
		}catch(e){
			console.error(e);
			throw 'sender nonce 호출 실패.';
		}
	}
	
	// getSenderNonce 와 동일
	async getNonce(web3Instance, address) {
		try {
			let nonce = await web3Instance.eth.getTransactionCount(address);
			return nonce;
		}catch(e){
			console.error(e);
			throw 'sender nonce 호출 실패.';
		}
	}
	
	// TokenPassSender 의 전송시 수수료 조회 (gas 아님)
	async getCurrentFee(web3Instance) { // getWeb3 로 정의한 web3Instance 를 받아서 쓴다.
		try {
			
			//console.log('SENDERABI : ', this.constants.SENDERABI);
			//console.log('SENDER_ADDR : ',this.constants.SENDER_ADDR);
			
			const sender = new web3Instance.eth.Contract(this.constants.SENDERABI, this.constants.SENDER_ADDR); // TokenPassSender contract 호출
			return await sender.methods.fee().call(); // TokenPassSender contract 의 fee() method 호출
		}catch(e){
			console.error(e);
			throw 'getCurrentFee 호출 실패.';
		}
	}
	
	// TokenPassSender 로 사용자가 전송한 fee 조회
	async getUserFeeData(web3Instance, address) { // getWeb3 로 정의한 web3Instance 를 받아서 쓴다.
		try {
			const sender = new web3Instance.eth.Contract(this.constants.SENDERABI, this.constants.SENDER_ADDR); // TokenPassSender contract 호출
			let userFee = await sender.methods.userFee(address).call();  // TokenPassSender contract 의 userFee() method 호출
			let userFeeCount = await sender.methods.userFeeCount(address).call(); // TokenPassSender contract 의 userFeeCount() method 호출
			return {"userFee":userFee, "userFeeCount": userFeeCount};
		}catch(e){
			console.error(e);
			throw 'getUserFeeData 호출 실패.';
		}
	}
};