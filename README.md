# TokenPass Wallet - Node.js Server

이더리움 기반 토큰 전송 및 지갑 관리를 위한 Node.js 백엔드 서버입니다.

## 📋 프로젝트 개요

TokenPass Wallet은 Web3.js를 활용하여 이더리움 네트워크와 상호작용하는 RESTful API 서버입니다. ERC20 토큰 전송, 멀티 센더 기능, 지갑 관리 등의 기능을 제공합니다.

## 🚀 주요 기능

### 1. 지갑 관리
- EVM 계정 생성
- 이더리움 잔고 조회
- ERC20 토큰 잔고 조회
- Nonce 관리

### 2. 트랜잭션 처리
- 이더리움 전송 (`/transferEther`)
- ERC20 토큰 전송 (`/transferToken`)
- 멀티 센더 기능 (`/multisend`)
- 예치금 전송 (`/depositSend`)

### 3. Gas 관리
- 실시간 Gas Price 조회
- 이더 전송 수수료 계산
- 토큰 전송 수수료 계산

### 4. 토큰 정보
- ERC20 토큰 정보 조회 (name, symbol, decimal)
- 토큰 잔고 조회

### 5. 멀티 센더
- 다중 주소로 토큰 일괄 전송
- 사용자 Fee 관리
- Fee 환불 기능 (`/claimUserFees`)

## 🛠 기술 스택

- **Runtime**: Node.js
- **Framework**: Express.js
- **Blockchain**: Web3.js (v1.2.6)
- **Dependencies**:
  - `bignumber.js`: 정밀한 숫자 계산
  - `ethereumjs-tx`: 트랜잭션 서명
  - `body-parser`: HTTP 요청 파싱
  - `node-fetch`: HTTP 요청

## 📦 설치 방법

```bash
# 저장소 클론
git clone https://github.com/moonlightpark/nodeServer.git
cd nodeServer

# 의존성 설치
npm install

# constants.js 파일 설정 (보안 정보 포함)
# constants.js 파일을 생성하고 필요한 설정값을 입력하세요
```

## ⚙️ 환경 설정

`constants.js` 파일에 다음 정보를 설정해야 합니다:
- 네트워크 설정 (Mainnet, Sepolia 등)
- 컨트랙트 주소
- Private Key
- 접근 허용 IP 목록
- ABI 정보

**⚠️ 주의**: `constants.js` 파일은 민감한 정보를 포함하므로 Git에 커밋되지 않습니다.

## 🚦 서버 실행

```bash
# 메인넷 서버 실행 (포트 3001)
node server.js

# 개발 서버 실행 (포트 3000)
node dev.js

# Sepolia 테스트넷 서버 실행 (포트 3002)
node doraemon01.js
```

## 📡 API 엔드포인트

### 계정 관리
- `GET /` - 서버 상태 확인
- `GET /ether/account` - 새 EVM 계정 생성
- `GET /ether/getbalance` - 이더리움 잔고 조회
- `GET /token/getbalance` - 토큰 잔고 조회

### 네트워크 정보
- `GET /ether/version/network` - 네트워크 정보 조회
- `GET /ether/gas` - 현재 Gas Price 조회

### Nonce 관리
- `GET /senderNonce` - Sender Owner의 Nonce 조회
- `GET /getUserNonce` - 특정 주소의 Nonce 조회

### 토큰 정보
- `GET /token/info` - ERC20 토큰 정보 조회

### Gas 계산
- `POST /ether/gasprice` - 이더 전송 수수료 계산
- `POST /token/gasprice` - 토큰 전송 수수료 계산

### 트랜잭션
- `POST /transferEther` - 이더리움 전송
- `POST /transferToken` - ERC20 토큰 전송
- `POST /multisend` - 멀티 센더 (다중 전송)
- `POST /depositSend` - 예치금 전송
- `GET /getTransction` - 트랜잭션 조회
- `GET /getTransactionReceipt` - 트랜잭션 Receipt 조회

### 멀티 센더 Fee 관리
- `GET /getCurrentFee` - 현재 전송 수수료 조회
- `GET /getUserFeeData` - 사용자 Fee 데이터 조회
- `POST /claimUserFees` - 사용자 Fee 환불

### 주소 정보
- `GET /senderAddress` - Multi Sender 주소 조회
- `GET /senderOwnerAddress` - Sender Owner 주소 조회

## 📁 프로젝트 구조

```
nodeServer/
├── abis/                    # 스마트 컨트랙트 ABI 파일
│   ├── ERC20ABI.json
│   ├── sender.json
│   └── sepolia/
├── classes/                 # 클래스 모듈
│   ├── gasPriceStore.js    # Gas Price 관리
│   └── txStore.js          # 트랜잭션 처리
├── log/                     # 로그 파일 디렉토리
├── common.js               # 공통 함수 모듈
├── constants.js            # 설정 상수 (Git 제외)
├── getWeb3.js              # Web3 인스턴스 생성
├── getToken.js             # 토큰 정보 로드
├── mysql-db.js             # MySQL 연결 (선택사항)
├── server.js               # 메인 서버 (포트 3001)
├── dev.js                  # 개발 서버 (포트 3000)
├── doraemon01.js           # Sepolia 서버 (포트 3002)
└── package.json            # 프로젝트 설정
```

## 🔒 보안

- IP 기반 접근 제어 구현
- Private Key는 `constants.js`에 안전하게 보관
- `.gitignore`를 통해 민감한 파일 제외
- 트랜잭션 서명은 서버에서 처리

## 📝 API 요청 예시

### 이더리움 잔고 조회
```bash
GET /ether/getbalance?address=0x1234...
```

### 토큰 전송
```bash
POST /transferToken
Content-Type: application/json

{
  "from": "0x1234...",
  "to": "0x5678...",
  "token": "0xabcd...",
  "balance": "1000000000000000000",
  "n": 5
}
```

### 멀티 센더
```bash
POST /multisend
Content-Type: application/json

{
  "txid_fee": "0x...",
  "txid_token": "0x...",
  "fromAddr": "0x1234...",
  "tokenAddr": "0xabcd...",
  "nonce": 10,
  "index": 1,
  "sendAddrs": [
    {"addr": "0x5678...", "amount": 100},
    {"addr": "0x9abc...", "amount": 200}
  ]
}
```

## 🌐 지원 네트워크

- Ethereum Mainnet (포트 3001)
- Sepolia Testnet (포트 3002)
- 개발 환경 (포트 3000)

## 📄 라이선스

ISC

## 👤 작성자

XXXXXXXXXXX

## 🔗 관련 링크

- [Web3.js 문서](https://web3js.readthedocs.io/)
- [Ethereum 공식 사이트](https://ethereum.org/)
- [ERC20 토큰 표준](https://eips.ethereum.org/EIPS/eip-20)

## ⚠️ 주의사항

1. `constants.js` 파일은 반드시 생성해야 하며, Private Key 등 민감한 정보를 포함합니다.
2. 프로덕션 환경에서는 반드시 HTTPS를 사용하세요.
3. IP 접근 제어를 적절히 설정하세요.
4. Gas Price는 네트워크 상황에 따라 변동되므로 주의하세요.
5. 트랜잭션 전송 전 충분한 테스트를 수행하세요.
