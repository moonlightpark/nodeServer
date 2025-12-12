const EthereumTx = require("ethereumjs-tx").Transaction;
const Web3Utils = require('web3-utils');
const Client = require('node-rest-client').Client;
const client = new Client();
const BN = require('bignumber.js');
const fs = require('fs');


// web3 와 통신 하거나 값을 처리하는 class
class txStore {
	// 생성자에서 body(request 들어온 값), costants(상수정의), GasPriceStore(실시간 가스 값), common(공통함수) 인자로 받는다.

	constructor(body, constants, GasPriceStore, common, token){
		this.constants = constants; // 전역변수 저장
		this.GasPriceStore = GasPriceStore; // 전역변수 저장
		this.common = common; // 전역변수 저장
		this.token = token; // 전역변수 저장
		
		
		// 아래 전역변수는 multi send 인경우만 사용함.
		this.reqData            = body.sendAddrs; // multi send addr와amount 데이터
		this.reqAddrs           = Array(); // multi send to addresses
		this.reqAmounts         = Array(); // multi send to amounts
		this.tokenAddr          = body.tokenAddr; // multi send token
		this.fromAddr			= body.fromAddr; // multi send from address
		this.address			= body.address; // 사용안함
		this.privateKey         = body.key; // 사용안함
		this.nonce				= parseInt(body.nonce); // multi send nonce
		this.index				= body.index; // api db trans_sid
		this.cotrolI			= 0; // confirmation 제어자 confirmation 여러번 호출 되기때문에 한번만 request 해주기 위한 제어자
		this.totalAmounts       = 0; // multi send 총 전송량
		if (this.reqData){ // reqData에서 addr 과 amount를 분리하여 tokenAddr, reqAmounts 에 담는다. (smartcontract에서 받는 데이터 타입으로 구조 변환)
			for(var i=0; i<this.reqData.length; i++ ){
				this.reqAddrs[i]        = this.reqData[i].addr;
				this.reqAmounts[i]      = this.reqData[i].amount;
				this.totalAmounts       = this.totalAmounts + this.reqData[i].amount;
			}
		}
		this.jsonAddrs   = JSON.stringify(this.reqAddrs);
		this.jsonAmounts = JSON.stringify(this.reqAmounts);
	}
	
	// transction 조회
	async getTransction(web3Instance, hash) {
		console.log('getTransction');
		return await web3Instance.eth.getTransaction(hash);
	}
	
	// transction receipt 조회
	async getTransactionReceipt(web3Instance, hash) {
		console.log('getTransactionReceipt');
		return await web3Instance.eth.getTransactionReceipt(hash);
	}
	
	// ether 전송시 필요한 gas 데이터 생성
	async getEtherGasPrice(web3Instance, req, gasPriceStore) {
		console.log('getEtherGasPrice');
		try{
			let gas = await web3Instance.eth.estimateGas({ // web3 estimateGas 를 이용하여 데이터 컨펌 및 gas 확인
					from: req.from, // 보내는사람 
					value: req.balance, // 보내는 ether balance
					to: req.to // 받는사람
			});
			gas = calcuterWithFercent(gas, 10); // 10% gas 더 추가
			console.log(gas);
			
			//const gasPriceStore = new GasPriceStore.GasPriceStore(); // GasPriceStore 생성
			var gasPrice_ = await gasPriceStore.gasPricePromise; // GasPriceStore 에서 현재 가스 기준 값 호출
			var gasPrice__ = Web3Utils.toWei(gasPrice_.toString(), 'gwei'); // wei 를 gwei로 casting
			
			console.log('gasPrice_ : ' + gasPrice_);
			console.log('gasPrice__ : ' + gasPrice__);
			
			//return await {'gasLimit':gas.toString(), 'gasPrice':gasPrice__}; // return
			return await {'gasLimit':gas.toString(), 'gasPrice':gasPrice__}; // return
		}catch(e){
			console.log('getEtherGasPrice error', e);
			throw "getEtherGasPrice 에러남.";
        }
	}
	
	// token 전송시 필요한 gas 데이터 생성
	async getTokenGasPrice(web3Instance, req, gasPriceStore) {
		console.log('txStore -> getTokenGasPrice');
		try{
			const tokenInfo = await this.common.getTokenInfo(web3Instance, req.address); // token 기본정보 호출			
			this.ERC20ABI = JSON.parse(fs.readFileSync('./abis/ropsten/ERC20ABI.json'));
			
			//console.log(this.constants.ERC20ABI);
			var ABI = this.constants.ERC20ABI;
			//const tokenContract = new web3Instance.eth.Contract(this.constants.ERC20ABI, req.address); // token contract 호출
			const tokenContract = new web3Instance.eth.Contract(ABI, req.address); // token contract 호출
			
			
			let encodedData = await tokenContract.methods.transfer(req.to, req.balance).encodeABI(); // evm에 전송할 encodedData 생성
			console.log(req.to);
			console.log(req.balance);
			//console.log(encodedData);
			
			let gas = await web3Instance.eth.estimateGas({ // web3 estimateGas 를 이용하여 데이터 컨펌 및 gas 확인
					from: req.from,    // 보내는사람
					data: encodedData, // transfer method 인코딩 데이터 
					value: 0x0,        // 보내는 ether balance
					to: req.address    // 받는사람
			});
			
			gas = calcuterWithFercent(gas , 10); // 5% gas 더 추가
			console.log(gas);
			//console.log(gasPriceStore.gasPricePromise);
			
			//const gasPriceStore = new GasPriceStore.GasPriceStore();

			var gasPrice_ = await gasPriceStore.gasPricePromise; // GasPriceStore 에서 현재 가스 기준 값 호출
			var gasPrice__ = Web3Utils.toWei(gasPrice_.toString(), 'gwei'); // wei 를 gwei로 casting


			console.log('gasPrice_ : ' + gasPrice_);
			console.log('gasPrice__ : ' + gasPrice__);
			
			//var gasPrice_ = gasPriceStore.gasPricePromise; // GasPriceStore 에서 현재 가스 기준 값 호출
			//var gasPrice__ = Web3Utils.toWei(gas.toString(), 'gwei'); // wei 를 gwei로 casting
			//return await {'gasLimit':gas.toString(), 'gasPrice':gasPrice__}; // return
			return await {'gasLimit':gas.toString(), 'gasPrice':gasPrice__}; // return
		}catch(e){
			console.log('getTokenGasPrice error', e);
			throw "getTokenGasPrice 에러남.";
        }
	}

	// ether 전송
	// 실제 evm 전송은 호출한 대상에서 한다.  hex data만 만들어서 리턴한다.
	async transferEther(web3Instance, req) {
		console.log('transferEther');
		try{
			var amountToSend = parseInt(req.balance); // balance
			let gas = await web3Instance.eth.estimateGas({ // web3 estimateGas 를 이용하여 데이터 컨펌 및 gas 확인
					from: req.from, // 보내는 사람
					value: amountToSend, // 보내는 ether balance
					to: req.to  // 받는 사람
			});
			gas = calcuterWithFercent(gas ,10); // 10% gas 더 추가
			const gasPriceStore = new GasPriceStore.GasPriceStore(); // GasPriceStore 생성
			var gasPrice_ = await gasPriceStore.gasPricePromise; // GasPriceStore 에서 현재 가스 기준 값 호출
			var gasPrice__ = Web3Utils.toHex(Web3Utils.toWei(gasPrice_.toString(), 'gwei')); // wei 를 gwei로 casting 하고 Hex로 바꾼다.
			
			let tx = { // 트랜잭션 데이터 저장
				nonce: web3Instance.utils.toHex(req.n), // nonce
				from: req.from, // 보내는사람
				to: req.to, // 받는 사람
				value:amountToSend, // 보내는 ether balance
				gas: gas, // gas limit
				gasPrice: gasPrice__, // 가스 가격
				data: '0x', // 이더 전송이므로 인코딩 데이터 필요없음
			}
			let privateKey = Buffer.from(req.key, 'hex'); // privateKey
			if (constants.netId() == "ropsten"){ // ropsten 인경우 두번째 인자로 chain을 전송해줘야한다.
				var transaction = new EthereumTx(tx, {'chain':'ropsten'}); // ropsten
			} else {
				var transaction = new EthereumTx(tx); // main net
			}
			transaction.sign(privateKey); // sign
			return transaction.serialize().toString('hex'); // 트랜잭션 데이터 hex return
			
		}catch(e){
			console.log('transferEther error', e);
			throw "transferEther 에러남.";
        }
	}
	
	// token 전송
	// 실제 evm 전송은 호출한 대상에서 한다.  hex data만 만들어서 리턴한다.
	async transferToken(web3Instance, req) {
		console.log('transferToken');
		try{
			const tokenInfo = await this.common.getTokenInfo(web3Instance, req.token); // 토큰정보 로드
			console.log(tokenInfo);
			const tokenContract = new web3Instance.eth.Contract(constants.ERC20ABI(), req.token); // 토큰 컨트랙트 로드
			const balance = req.balance; // 전송할 balance
			let encodedData = await tokenContract.methods.transfer(req.to, balance).encodeABI(); // evm에 전송할 encodedData 생성
			let gas = await web3Instance.eth.estimateGas({ // web3 estimateGas 를 이용하여 데이터 컨펌 및 gas 확인
					from: req.from, // 보내는 사람
					data: encodedData, // transfer method 인코딩 데이터 
					value: 0x0, // ether 는 보내지 않음
					to: req.token // 받는 곳은 token contract 주소
			});
			gas = calcuterWithFercent(gas ,10); // 5% gas 더 추가
			const gasPriceStore = new GasPriceStore.GasPriceStore(); // GasPriceStore 생성
			var gasPrice_ = await gasPriceStore.gasPricePromise; // GasPriceStore 에서 현재 가스 기준 값 호출
			var gasPrice__ = Web3Utils.toHex(Web3Utils.toWei(gasPrice_.toString(), 'gwei')); // wei 를 gwei로 casting 하고 Hex로 바꾼다.
			
			let tx = { // 트랜잭션 데이터 생성
				nonce: web3Instance.utils.toHex(req.n), // nonce
				from: req.from, // 보내는사람
				to: req.token, // 받는 사람
				value:0x0, // ether 는 보내지 않음
				gas: gas, // gas limit
				gasPrice: gasPrice__, // 가스 가격
				data: encodedData, // transfer method 인코딩 데이터 
			}
			let privateKey = Buffer.from(req.key, 'hex'); // privateKey
			if (constants.netId() == "ropsten"){ // ropsten 인경우 두번째 인자로 chain을 전송해줘야한다.
				console.log('transferToken -> ropsten ');
				var transaction = new EthereumTx(tx, {'chain':'ropsten'}); // ropsten
			} else {
				console.log('transferToken -> main ');
				var transaction = new EthereumTx(tx); // main net
			}
			transaction.sign(privateKey); // sign
			return transaction.serialize().toString('hex'); // 트랜잭션 데이터 hex return
		}catch(e){
			console.log('transferToken error', e);
			throw "transferToken 에러남.";
        }
	}
	
	// 토큰패스에서 회원 미가입상태->가입으로 상태 바뀐경우  sender에 예치되어 있는 금액을 가입으로 상태 바뀐 사람에게 전송한다.
	// 실제 evm 전송은 호출한 대상에서 한다.  hex data만 만들어서 리턴한다.
	async depositSend(web3Instance, req){
		console.log('depositSend');
		try{
			const tokenInfo = await this.common.getTokenInfo(web3Instance, req.token); // 토큰정보 로드
			
			// 전송해야할 금액이 소숫점을 없애야 하기 때문에 토큰정보에서 가져온 decimal을 확인하여 소숫점을 없애는 작업을 한다.
			var amount = totalBalanceWithDecimals(req.balance, multiplier(tokenInfo.decimal)); 
			const senderContract = new web3Instance.eth.Contract(constants.SENDERABI(), constants.SENDER_ADDR()); // sender 컨트랙트 로드

			let encodedData = await senderContract.methods.depositUserToken(req.from, req.to, amount, req.token, 1).encodeABI(); // evm에 전송할 encodedData 생성

			let gas = await web3Instance.eth.estimateGas({ // web3 estimateGas 를 이용하여 데이터 컨펌 및 gas 확인
					from: constants.SENDER_OWNER(), // 보내는사람 sender 컨트랙트에 depositUserToken 함수는 sender owner 전용 함수이므로 변경 불가.
					data: encodedData, // depositUserToken method 인코딩 데이터
					value: 0x0, // 이더는 안보냄
					to: constants.SENDER_ADDR() // 받는 사람은 sender 컨트랙트 address
			});
			gas = calcuterWithFercent(gas ,10);  // 5% gas 더 추가
			const gasPriceStore = new GasPriceStore.GasPriceStore(); // GasPriceStore 생성
			var gasPrice_ = await gasPriceStore.gasPricePromise; // GasPriceStore 에서 현재 가스 기준 값 호출
			var gasPrice__ = Web3Utils.toHex(Web3Utils.toWei(gasPrice_.toString(), 'gwei')); // wei 를 gwei로 casting 하고 Hex로 바꾼다.
			console.log('gas', gas); // log
			console.log('gasPrice', gasPrice__); // log
			let nonce = await web3Instance.eth.getTransactionCount(constants.SENDER_OWNER()); // nonce 값 확인
			console.log('nonce', nonce); // log
			
			let tx = { // 트랜잭션 데이터 생성
				nonce: web3Instance.utils.toHex(nonce), // nonce
				from: constants.SENDER_OWNER(), // 보내는 사람
				to: constants.SENDER_ADDR(), // 받는 사람
				value:0x0, // ether balance
				gas: gas, // gas limit
				gasPrice: gasPrice__, // gas price
				data: encodedData, // depositUserToken method 인코딩 데이터
			}
			let privateKey = Buffer.from(constants.SENDER_OWNER_KEY(), 'hex'); // sender owner privateKey
			if (constants.netId() == "ropsten"){ // ropsten 인경우 두번째 인자로 chain을 전송해줘야한다.
				var transaction = new EthereumTx(tx, {'chain':'ropsten'}); // ropsten
			} else {
				var transaction = new EthereumTx(tx); // main net
			}
			transaction.sign(privateKey); // sign
			return transaction.serialize().toString('hex'); // 트랜잭션 데이터 hex return
			
		}catch(e){
			console.log('depositSend error', e);
			throw "depositSend 에러남.";
        }
	}
	
	// multi sender claim 시에 유저에게 받은 fee를 sender 컨트랙트 에서 빼서 유저에게 돌려준다.
	// 실제 evm 전송은 호출한 대상에서 한다.  hex data만 만들어서 리턴한다.
	async claimUserFees(web3Instance, req) {
		console.log('claimUserFees');
		try{
			const senderContract = new web3Instance.eth.Contract(constants.SENDERABI(), constants.SENDER_ADDR());  // sender 컨트랙트 로드
			const balance = req.balance; // claimUserFees method 에서 받을 balance
			let encodedData = await senderContract.methods.claimUserFees(req.address, req.balances, req.feeCount).encodeABI(); // evm에 전송할 encodedData 생성
			let gas = await web3Instance.eth.estimateGas({ // web3 estimateGas 를 이용하여 데이터 컨펌 및 gas 확인
					from: constants.SENDER_OWNER, // 보내는사람 : sender 컨트랙트에 claimUserFees 함수는 sender owner 전용 함수이므로 변경 불가.
					data: encodedData, // claimUserFees method 인코딩 데이터
					value: 0x0, // 이더 안보냄
					to: constants.SENDER_ADDR // 받는 사람은 sender 컨트랙트 address
			});
			gas = calcuterWithFercent(gas ,10); // 5% gas 더 추가
			const gasPriceStore = new GasPriceStore.GasPriceStore(); // GasPriceStore 생성
			var gasPrice_ = await gasPriceStore.gasPricePromise; // GasPriceStore 에서 현재 가스 기준 값 호출
			var gasPrice__ = Web3Utils.toHex(Web3Utils.toWei(gasPrice_.toString(), 'gwei')); // wei 를 gwei로 casting 하고 Hex로 바꾼다.
			console.log('gas', gas); // log
			console.log('gasPrice', gasPrice__); // log
			let nonce = await web3Instance.eth.getTransactionCount(constants.SENDER_OWNER()); // sender owner nonce 확인
			console.log('nonce', nonce); // log
			let tx = { // 트랜잭션 데이터 생성
				nonce: web3Instance.utils.toHex(nonce), // nonce
				from: constants.SENDER_OWNER, // 보내는사람
				to: constants.SENDER_ADDR, // 받는사람
				value:0x0, // ether balance
				gas: gas, // gas limit
				gasPrice: gasPrice__, // gas price
				data: encodedData, // claimUserFees method 인코딩 데이터
			}
			let privateKey = Buffer.from(constants.SENDER_OWNER_KEY(), 'hex'); // sender owner privateKey
			if (constants.netId() == "ropsten"){ // ropsten 인경우 두번째 인자로 chain을 전송해줘야한다.
				var transaction = new EthereumTx(tx, {'chain':'ropsten'}); // ropsten
			} else {
				var transaction = new EthereumTx(tx); // main net
			}
			transaction.sign(privateKey); // sign
			return transaction.serialize().toString('hex'); // 트랜잭션 데이터 hex return
			
		}catch(e){
			console.log('transferToken error', e);
			throw "transferToken 에러남.";
        }
	}
	
	// multi send
	async multiSender(web3Instance, senderContract, constants, gasPriceStore) {
		console.log('multiSender');
        try {
	        
	        //this.constants = constants;
	        console.log('senderContract : ', senderContract);
	        
			var senderOwner = constants.SENDER_OWNER; // 상수에서 정의된 sender owner 주소
			var senderOwnerKey = constants.SENDER_OWNER_KEY; // 상수에서 정의된 sender owner privatekey
			var tokenInfo = await this.common.getTokenInfo(web3Instance, this.tokenAddr); // multi 전송 토큰정보 호출
			
			var reqAmounts_ = Array(); // 전송할 토큰 balance 저장소 
			for(var i=0; i<this.reqAmounts.length; i++ ){
				reqAmounts_[i] = totalBalanceWithDecimals(this.reqAmounts[i], multiplier(tokenInfo.decimal)); // 소숫점을 없애고 토큰 decimal 적용 하여 변환
			}
			
			let encodedData = await senderContract.methods.multisendToken(this.tokenAddr, this.fromAddr,this.reqAddrs,  
				reqAmounts_).encodeABI({from: senderOwner}); // evm에 전송할 encodedData 생성
			

			//console.log('senderOwner : ', senderOwner);
			//console.log('senderOwnerKey : ', senderOwnerKey);
			console.log('tokenInfo : ', tokenInfo);			
			console.log('tokenAddr : ', this.tokenAddr);
			console.log('fromAddr : ', this.fromAddr);
			console.log('reqAddrs : ', this.reqAddrs);
			//console.log('reqAddrs : ', encodedData);
			console.log('SENDER_ADDR : ', constants.SENDER_ADDR);

			
			
			let gas = await web3Instance.eth.estimateGas({ // web3 estimateGas 를 이용하여 데이터 컨펌 및 gas 확인
					from: senderOwner, // 보내는사람 : sender 컨트랙트에 multisendToken 함수는 sender owner 전용 함수이므로 변경 불가.
					data: encodedData, // multisendToken method 인코딩 데이터
					value: 0x0, // ether balance
					to: constants.SENDER_ADDR // 받는 사람은 sender 컨트랙트 address  constants.SENDER_ADDR
			});
			
			console.log('################');
			
			//console.log('gas',gas + 150000);
			gas = calcuterWithFercent(gas ,10); // 10% gas 더 추가
			// GasPriceStore
			//const gasPriceStore = new GasPriceStore.GasPriceStore(); // GasPriceStore 생성
			var gasPrice_ = await gasPriceStore.gasPricePromise; // GasPriceStore 에서 현재 가스 기준 값 호출
			console.log(typeof gasPrice_, gasPrice_); // log
			var gasPrice__ = Web3Utils.toHex(Web3Utils.toWei(gasPrice_.toString(), 'gwei')); // wei 를 gwei로 casting 하고 Hex로 바꾼다.
			console.log(typeof gasPrice__, gasPrice__); // log
			console.log('~~~~~~~~~~~~~~~~~~'); // log
			console.log('index : ', this.index); // log
			let tx = { // 트랜잭션 데이터 생성
				nonce: web3Instance.utils.toHex(this.nonce), // nonce
				from: senderOwner, // 보내는사람
				to: this.constants.SENDER_ADDR, // 받는사람
				gas: gas, // gas limit
				gasPrice: gasPrice__, // gas price
				data: encodedData, // multisendToken method 인코딩 데이터
			}
			let privateKey = Buffer.from(senderOwnerKey, 'hex'); // sender owner privateKey
			console.log(constants.netId); // log
			if (constants.netId == "ropsten"){ // ropsten 인경우 두번째 인자로 chain을 전송해줘야한다.
				var transaction = new EthereumTx(tx, {'chain':'ropsten'}); // ropsten
			} else {
				var transaction = new EthereumTx(tx); // main net
			}
			
			transaction.sign(privateKey);// Sign transaction
			// Send signed transaction start
			web3Instance.eth.sendSignedTransaction("0x" + transaction.serialize().toString('hex'), (_err, _res) => {
				// this.index
				if(_err){
					console.error("ERROR: ", _err); // error 인경우 업데이트 한다.
				} else {
					console.log("Success: ", _res); // 여기서 hash 를 한번 업데이트 한다.
				}
			}).on('confirmation', (confirmationNumber, receipt) => {
				console.log('=> confirmation['+this.index+']: ' + confirmationNumber); // log
				var args = {
				  data: { index: this.index,hash: '' },
				  headers: { "Content-Type": "application/json" }
				};
				this.cotrolI = this.cotrolI + 1; // updateReceipt 제어자
				if (this.cotrolI == 1){ // 한번만 돌게 한다.
					if (constants.netId() == "ropsten"){ // ropsten 인경우 sub domain dev
						client.post("https://dev.tokenpass.me/v1/transction/updateReceipt", args, function (data, response) {});// receipt 업데이트
					} else { // main net 인경우 sub domain api
						client.post("https://api.tokenpass.me/v1/transction/updateReceipt", args, function (data, response) {});// receipt 업데이트
					}
				}
			})
			.on('transactionHash', hash => { // pendding 시작 지점
				console.log('=> hash');
				console.log(hash);
				var args = {
				  data: { index: this.index,hash: hash }, // index 값은 api 디비 trans_sid 값
				  headers: { "Content-Type": "application/json" }
				};
				// pendding 업데이트
				if (constants.netId == "ropsten"){ // ropsten 인경우 sub domain dev
					client.post("https://dev.tokenpass.me/v1/transction/updateHash", args, function (data, response) {}); // tx hash 업데이트
				} else { // main net 인경우 sub domain api
					client.post("https://api.tokenpass.me/v1/transction/updateHash", args, function (data, response) {}); // tx hash 업데이트
				}
				
			})
			.on('receipt', receipt => { // 블럭컨펌 완료시 작동.. 오래걸려서 작동 안하는 경우가 있어서 사용하지 않음 대신 지속적으로 tx hash를 조회하여 처리 해야함 log만 남김
				console.log('=> receipt');
				console.log(receipt);
			})
			.on('error', console.error); // error
			
        }catch(e){
			console.log('multiSender error ['+this.index+']', e);
			throw "multiSender 에러남.";
        }
		
	}
}

// balance 에 소숫점 적용 함수
function totalBalanceWithDecimals(totalBalance, multiplier) {
	return new BN(totalBalance).times(multiplier).toString(10);
}

// 제곱승 만드는 함수
function multiplier(decimals){
	var decimals = Number(decimals);
	return new BN(10).pow(decimals);
}

// 백분율로 상승 시키는 함수 val1 수치를 val2 만큼 퍼센트 상승 시켜서 return
function calcuterWithFercent(val1 ,val2){
	return Math.ceil(val1 + (val1 * val2 / 100));
}

module.exports = {txStore};
