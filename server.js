const express = require('express');
const bodyParser = require('body-parser');
const BN = require('bignumber.js');
var app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
const port = 3001; // 3000:developer, 3001:main-net, 3002:sepolia

// 웹서버 start
var server = app.listen(port, function(){
    console.log(`Express Main server has started on port ${port}`)
})

// 상수 호출
const Constants = require('./constants');
const constants = new Constants(port);
// 공통 함수 호출
const Common = require('./common');
const common = new Common(constants);
// getWeb3.js 네트워크 로드
const GetWeb3 = require('./getWeb3');
const web3Info = new GetWeb3(constants).getResult();
// erc20 토큰 정보 로드 모듈 호출
const GetToken = require('./getToken');
const getToken = new GetToken(constants); 
// gas 관리 모듈 호출
const GasPriceStore = require('./classes/gasPriceStore');
const gasPriceStore = new GasPriceStore();
// web3 통신 모듈 호출
const TxStore = require('./classes/txStore');

var access_ips = constants.access_ips; // 접근 가능 아이피
app.use((req, res, next) => { // 접근 가능 아이피 제어
	var ip = req.ip.split(":").pop();
	//console.log(ip);
    if (access_ips.includes(ip)){
		next();
	} else {
		console.log(ip);
		console.log('not in valid ip');
		return;
	}
});

// index
app.get('/', (req, res) => {
	var ip = req.ip.split(":").pop();
	console.log(ip);
    res.status(200).send({error: false, message: 'doraemon01'});
});

// test 용 아래 코드는 infura의 pending 중인 tx를 조회하는 프로세서 이걸로 뭔가 할수 있을꺼 같아서 구현해놓음
app.get('/test', (req, res) => {
	web3Info.web3Instance.eth.getBlock("pending",
		function (error, block) {
			//console.log(block);
			var pl=block.transactions.length;
			if(pl>1){
				//console.log(typeof block.transactions);
				for(var i=0; i<pl; i++){
					console.log(`${i} : `,block.transactions[i]);
					if (block.transactions[i] == '0x6a217179f59ef7d9fa6e1e17ed3a16038dddcb86acfd7fb6d16af15067c75e6a'){
						console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
					}
				}
				console.log(pl);
				console.log("pending...");
			}
	});
    res.status(200).send({error: false, message: 'doraemon01'});
});

// SENDER_OWNER 의 nonce 값을 확인 한다.
// method get 
// request {}
// response {error:boolean, body: {nonce:5}}
app.get('/senderNonce', function(req, res){ // end point 정의
	common.getSenderNonce(web3Info.web3Instance, constants.SENDER_OWNER).then(function(result){ // 공통 함수 모듈에서 확인
		res.status(200).send({error: false, body : {nonce:result}}); // 성공 return
	},function(err){
		console.log('/senderNonce error! : ', err); // 에러 로그
		res.status(400).send({error: true, body : {}}); // 에러 return
	});
});

// multi sender 의 address 확인 한다.
// method get
// request {}
// response {error:boolean, body: address}
app.get('/senderAddress', function(req, res){ // end point 정의
	res.status(200).send({error: false, body : constants.SENDER_ADDR}); // 성공 return
});

// SENDER_OWNER 의 address 확인 한다.
// method get
// request {}
// response {error:boolean, body: address}
app.get('/senderOwnerAddress', function(req, res){ // end point 정의
	res.status(200).send({error: false, body : constants.SENDER_OWNER}); // 성공 return
});

// ether 전송 수수료 확인
// method post
// request {from:address, to:address, balance:1}
// response {error:boolean, body:{gasLimit:gas, gasPrice:gasPrice}}
app.post('/ether/gasprice', function(req, res){ // end point 정의
	const txStore = new TxStore.txStore(req.body, constants, gasPriceStore, common); // txStore 생성
	txStore.getEtherGasPrice(web3Info.web3Instance, req.body).then(function(result){ // txStore 모듈에서 ether 전송 가스만 계산 하는 함수 호출
		console.log(result);
		res.status(200).send({error: false, body: result}); // 성공 return
	},function(err){
		console.log('/ether/gasprice : ', err); // 에러 로그
		res.status(400).send({error: true}); // 에러 return
	});
});

// erc20 토큰 전송 수수료 확인
// method post
// request {from:address, to:address, address:contractAddress, balance:1}
// response {error:boolean, body:{gasLimit:gas, gasPrice:gasPrice}}
app.post('/token/gasprice', function(req, res){ // end point 정의
	const txStore = new TxStore.txStore(req.body, constants, gasPriceStore, common); // txStore 생성
	txStore.getTokenGasPrice(web3Info.web3Instance, req.body).then(function(result){ // txStore 모듈에서 토큰전송 가스만 계산 하는 함수 호출
		console.log(result);
		res.status(200).send({error: false, body: result}); // 성공 return
	},function(err){
		console.log('/token/gasprice : ', err); // 에러 로그
		res.status(400).send({error: true}); // 에러 return
	});
});

// EVM 계정 생성
// method get
// request {}
// response {error:boolean, body:{address:address, privateKey:key}}
app.get('/ether/account', function(req, res){ // end point 정의
	var Web3EthAccounts = require('web3-eth-accounts'); // accounts 관련 모듈 호출
	var account = new Web3EthAccounts('ws://localhost:8546'); // accounts 모듈 생성
	var result = account.create(); // 계정 생성
	res.status(200).send({error: false, body: result}); // 성공 return
});

// ether balance 조회
// method get
// request {address:address}
// response {error:boolean, body:ethBalance}
app.get('/ether/getbalance', function(req, res){ // end point 정의
	var walletAddress = req.query.address; // 조회할 address 변수
	common.getEthBalance(web3Info.web3Instance, walletAddress).then(function(result){ // 공통 함수에서 조회
		res.status(200).send({error: false, body : result}); // 성공 return
	},function(err){
		console.log('/ether/getbalance error! : ', err); // 에러 로그
		res.status(400).send({error: true, body : {}}); // 에러 return
	});
});

// 네트워크에 연결되어 있는 정보 조회
// method get
// request {}
// response {error:boolean, body:{netIdName:Sepolia, explorerUrl:https://sepolia.etherscan.io}}
app.get('/ether/version/network', (req, res) => { // end point 정의
	// web3Info 에서 정보 조회
	let res_data = {
		netIdName : web3Info.netIdName,
		explorerUrl : web3Info.explorerUrl,
	}
	res.status(200).send({error: false, body : res_data}); // 성공 return
});

// 네트워크에서 사용 하고 있는 gas 정보 조회
// method get
// request {}
// response {error:boolean, body:{"health":true,"block_number":9706077,"slow":1.1,"standard":2.8,"fast":8,"instant":10.1,"block_time":12.774}}
app.get('/ether/gas', (req, res) => { // end point 정의
	common.getGasPrice().then(function(result){ // 공통 함수 모듈에서 확인
		res.status(200).send({error: false, body : result}); // 성공 return
	},function(err){
		console.log('/ether/gas error! : ', err); // 에러 로그
		res.status(400).send({error: true, body : {}}); // 에러 return
	});
});

// erc20 토큰 정보 조회
// method get
// request {address:contractAddress}
// response {error:boolean, body:{name:name ,symbol:symbol ,decimal:decimal}} 
app.get('/token/info', (req, res) => { // end point 정의
	var token = req.query.address; // 토큰 주소 저장
	common.getTokenInfo(web3Info.web3Instance, token).then((result) => { // 공통 함수 모듈에서 확인
		res.status(200).send({error: false, body : result}); // 성공 return
	},(err) => {
		console.log('/token/info error! : ', err); // 에러 로그
		res.status(400).send({error: true, body : {}}); // 에러 return
	});
});

// erc20 토큰 잔고 조회
// method get
// request {address:address, token:contractAddress, decimal:decimal}
// response {error:boolean, body:balance} 
app.get('/token/getbalance', (req, res) => { // end point 정의
	var address = req.query.address; // 지갑주소
	var token = req.query.token; // 토큰주소
	var decimal = req.query.decimal; // 토큰 소숫점 자리수
	common.getTokenBalance(web3Info.web3Instance, token, address).then((result) => { // 공통 함수 모듈에서 확인
		var returnData = result;
		if (decimal){ // 소숫점 자리수 받은게 잇으면 소숫점 자리수 반영 하여 리턴
			returnData = totalBalanceWithOutDecimals(result, multiplier(decimal)); // balance에 소숫점 자리수 적용하여 데이터 생성
		}
		res.status(200).send({error: false, body : returnData}); // 성공 return
	},(err) => {
		console.log('/token/info error! : ', err); // 에러 로그
		res.status(400).send({error: true, body : 0}); // 에러 return
	});
});

// 토큰패스 멀티 센더
// method post
// request {txid_fee:hash, txid_token:hash, fromAddr:address, tokenAddr:address, nonce:nonce, index:trans_sid, sendAddrs[{addr:address, amount:1}]}
// response {error:boolean} 
app.post('/multisend', (req, res) => { // end point 정의
	const txStore = new TxStore.txStore(req.body, constants, gasPriceStore, common);  // txStore 생성
	const senderContract = new web3Info.web3Instance.eth.Contract(constants.SENDERABI, constants.SENDER_ADDR); // sender contract 로드
	
	txStore.multiSender(web3Info.web3Instance, senderContract).then(function(result){ // txStore multiSender 호출
		// multiSender 함수는 함수 안에서 async 호출 이기 때문에 response로 바로 보낼수 없음
		// 함수 구조를 바꾸면 가능함 하지만 타임아웃 걸릴수도 있으니 추후 구현시 유의 하여야함 (아래쪽에 구현된 depositSend 형태로 짜면됨)
		// sign 까지만 정확히 되었다면 true로 판단하여 리턴
		res.status(200).send({error: false});  // 성공 return
	},function(err){
		console.log(err); // 에러 로그 (디테일 에러는 함수에서 처리)
		res.status(400).send({error: true}); // 에러 return
	});
});

// 트랜잭션 상태를 조회한다.
// method get
// request {hash:hash}
// response {error:boolean, body:{hash result data}} 
app.get('/getTransction', (req, res) => { // end point 정의
	const txStore = new TxStore.txStore(req.body, constants, gasPriceStore, common);  // txStore 생성
	var hash = req.query.hash; // 입력받은 hash
	console.log(hash);
	txStore.getTransction(web3Info.web3Instance, hash).then(function(result){ // txStore getTransction 호출
		//console.log(result);
		res.status(200).send({error: false, body: result}); // 성공 return
	},function(err){
		console.log(err); // 에러 로그 
		res.status(400).send({error: true}); // 에러 return
	});
});

// 트랜잭션 receipt를 조회한다.
// method get
// request {hash:hash}
// response {error:boolean, body:{hash receipt data}} 
app.get('/getTransactionReceipt', (req, res) => { // end point 정의
	const txStore = new TxStore.txStore(req.body, constants, gasPriceStore, common); // txStore 생성
	var hash = req.query.hash; // 입력받은 hash
	console.log(hash);
	txStore.getTransactionReceipt(web3Info.web3Instance, hash).then(function(result){ // txStore getTransactionReceipt 호출
		//console.log(result);
		res.status(200).send({error: false, body : result});  // 성공 return
	},function(err){
		console.log(err); // 에러 로그 
		res.status(400).send({error: true}); // 에러 return
	});
});

// multi send 할경우 건당 수수료 조회
// method get
// request {}
// response {error:boolean, body:1000000000000000} * wei 단위 리턴
app.get('/getCurrentFee', (req, res) => { // end point 정의
	common.getCurrentFee(web3Info.web3Instance).then((result) => { // 공통 함수에서 조회
		res.status(200).send({error: false, body : result}); // 성공 return
	},(err) => {
		console.log('/getCurrentFee error! : ', err); // 에러 로그 
		res.status(400).send({error: true, body : 0}); // 에러 return
	});
});

// 멀티센더 컨트랙트에 전송해놓은 사용자의 fee 조회
// method get
// request {address:user address}
// response {error:boolean, body:{userFee:사용가능fee, userFeeCount:사용가능횟수}}
app.get('/getUserFeeData', (req, res) => { // end point 정의
	var address = req.query.address; // 조회할 address
	common.getUserFeeData(web3Info.web3Instance, address).then((result) => { // 공통 함수에서 조회
		res.status(200).send({error: false, body : result}); // 성공 return
	},(err) => {
		console.error('/getUserFeeData error! : ', err); // 에러 로그 
		res.status(400).send({error: true, body : 0}); // 에러 return
	});
});

// 입력받은 address의 nonce 를 조회한다.
// method get
// request {address:address}
// response {error:boolean, body:{nonce:1}}
app.get('/getUserNonce', function(req, res){ // end point 정의
	var address = req.query.address; // 입력받은 address
	common.getSenderNonce(web3Info.web3Instance, address).then(function(result){ // 공통 함수에서 조회
		res.status(200).send({error: false, body : {nonce:result}}); // 성공 return
	},function(err){
		console.log('/senderNonce error! : ', err); // 에러 로그 
		res.status(400).send({error: true, body : {}}); // 에러 return
	});
	
});

// 토큰패스에서 회원 미가입상태->가입으로 상태 바뀐경우  sender에 예치되어 있는 금액을 가입으로 상태 바뀐 사람에게 전송한다.
// method post
// request {from:address, to:address, balance:1, token:contractAddress}
// response {error:boolean, hash:txhash}
app.post('/depositSend', (req, res) => { // end point 정의
	console.log('-------depositSend--------');
	const txStore = new TxStore.txStore(req.body, constants, gasPriceStore, common); // txStore 생성
	var data = req.body; // 입력받은 데이터
	console.log(data);
	txStore.depositSend(web3Info.web3Instance, data).then(function(result){ // txStore 모듈의 depositSend 호출 하여 데이터검증,gas 세팅후 txhash 리턴
		web3Info.web3Instance.eth.sendSignedTransaction("0x" + result, (_err, _res) => { // Transaction send
			if(_err){ // 에러 return
				console.error("ERROR: ", _err);
				res.status(400).send({error: true});
			} else { // 성공 return
				console.log("depositSend Success: ", _res);
				res.status(200).send({error: false, hash : _res});
			}
		})
	},function(err){ // txhash 생성 실패
		console.log(err);
		res.status(400).send({error: true});
	});
});

// 이더송금
// method post
// request {from:address, to:address, balance:1, n:nonce}
// response {error:boolean, hash:txhash}
app.post('/transferEther', (req, res) => { // end point 정의
	console.log('-------transferEther--------');
	const txStore = new TxStore.txStore(req.body, constants, gasPriceStore, common); // txStore 생성
	var data = req.body; // 입력받은 데이터
	txStore.transferEther(web3Info.web3Instance, data).then(function(result){// txStore 모듈의 transferEther 호출 하여 데이터검증,gas 세팅후 txhash 리턴
		web3Info.web3Instance.eth.sendSignedTransaction("0x" + result, (_err, _res) => { // Transaction send
			if(_err){ // 에러 return
				console.error("ERROR: ", _err);
				res.status(400).send({error: true});
			} else { // 성공 return
				console.log("transferEther Success: ", _res);
				res.status(200).send({error: false, hash : _res});
			}
		})

	},function(err){ // txhash 생성 실패
		console.log(err);
		res.status(400).send({error: true});
	});
});

// erc20 토큰 송금
// method post
// request {from:address, to:address, token:contractAddress, balance:1, n:nonce}
// response {error:boolean, hash:txhash}
app.post('/transferToken', (req, res) => { // end point 정의
	console.log('-------transferToken--------');
	const txStore = new TxStore.txStore(req.body, constants, gasPriceStore, common); // txStore 생성
	var data = req.body; // 입력받은 데이터
	txStore.transferToken(web3Info.web3Instance, data).then(function(result){// txStore 모듈의 transferToken 호출 하여 데이터검증,gas 세팅후 txhash 리턴
		var balance = totalBalanceWithOutDecimals(data.balance, multiplier(18)); // 혹시 결과 리턴시 balance 를 소숫점 자리수 적용한값 보내줘야하는경우 사용
		web3Info.web3Instance.eth.sendSignedTransaction("0x" + result, (_err, _res) => { // Transaction send
			if(_err){ // 에러 return
				console.error("ERROR: ", _err);
				res.status(400).send({error: true});
			} else { // 성공 return
				console.log("transferToken Success: ", _res);
				res.status(200).send({error: false, hash : _res});
			}
		})
	},function(err){ // txhash 생성 실패
		console.log(err);
		res.status(400).send({error: true});
	});
});

// multi sender claim 시에 유저에게 받은 fee를 sender에서 빼서 유저에게 돌려준다.
// method post
// request {address:address, balance:1, feeCount:2} * feeCount 와 balance는 getUserFeeData 로 조회할수 있다 위에있음
// response {error:boolean, hash:txhash}
app.post('/claimUserFees', (req, res) => { // end point 정의
	console.log('-------claimUserFees--------');
	const txStore = new TxStore.txStore(req.body, constants, gasPriceStore, common); // txStore 생성
	var data = req.body; // 입력받은 데이터
	console.log(data);
	txStore.claimUserFees(web3Info.web3Instance, data).then(function(result){// txStore 모듈의 claimUserFees 호출 하여 데이터검증,gas 세팅후 txhash 리턴
		console.log(result);
		web3Info.web3Instance.eth.sendSignedTransaction("0x" + result, (_err, _res) => { // Transaction send
			if(_err){ // 에러 return
				console.error("ERROR: ", _err);
				res.status(400).send({error: true});
			} else { // 성공 return
				console.log("claimUserFees Success: ", _res);
				res.status(200).send({error: false, hash : _res});
			}
		})
	},function(err){ // txhash 생성 실패
		console.log(err);
		res.status(400).send({error: true});
	});
});

// balance 에 소숫점 적용 함수
function totalBalanceWithDecimals(totalBalance, multiplier) {
	return new BN(totalBalance).times(multiplier).toString(10);
}
// balance 에 소숫점 빼는 함수
function totalBalanceWithOutDecimals(totalBalance, multiplier) {
	//console.log('totalBalance\n',totalBalance);
	const balanceWeiBN = new BN(totalBalance)

	const beforeDecimal = balanceWeiBN.div(multiplier)
	const afterDecimal  = balanceWeiBN.mod(multiplier)

	//console.log(beforeDecimal.toString())    // >> 31
	//console.log(afterDecimal.toString())     // >> 415926500000000000
	return beforeDecimal.toString();
}

// 제곱승 만드는 함수
function multiplier(decimals){
	var decimals = Number(decimals);
	return new BN(10).pow(decimals);
}