import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { useSEO } from '../hooks/useSEO'
import { trackAreaVisited, AREAS } from '../utils/achievements'

type BankAccount = {
  balance: number
  interestRate: number
  lastUpdate: string
  accountType: 'basic' | 'premium' | 'vip'
}

type Investment = {
  id: string
  name: string
  icon: string
  description: string
  minInvestment: number
  expectedReturn: number // percentage per day
  risk: 'low' | 'medium' | 'high'
  duration: number // days
}

type UserInvestment = {
  investmentId: string
  amount: number
  startDate: string
  endDate: string
  expectedReturn: number
}

type LoanOffer = {
  id: string
  amount: number
  interestRate: number
  duration: number // days
  requirements: {
    minBalance: number
    minDays: number
  }
}

const INVESTMENTS: Investment[] = [
  {
    id: 'momonga-bonds',
    name: 'モモンガ債券',
    icon: '📜',
    description: '安定した低リスク投資。期待リターン14%（±20%変動）',
    minInvestment: 100,
    expectedReturn: 2, // 2% per day
    risk: 'low',
    duration: 7
  },
  {
    id: 'acorn-futures',
    name: 'どんぐり先物',
    icon: '🌰',
    description: '季節変動あり。期待リターン15%（±50%変動）',
    minInvestment: 300,
    expectedReturn: 5,
    risk: 'medium',
    duration: 3
  },
  {
    id: 'forest-stocks',
    name: '森林株',
    icon: '🌲',
    description: '期待リターン10%（±80%変動）。ハイリスク・ハイリターン！',
    minInvestment: 500,
    expectedReturn: 10,
    risk: 'high',
    duration: 1
  }
]

const LOAN_OFFERS: LoanOffer[] = [
  {
    id: 'micro-loan',
    amount: 200,
    interestRate: 10,
    duration: 7,
    requirements: { minBalance: 50, minDays: 3 }
  },
  {
    id: 'standard-loan',
    amount: 1000,
    interestRate: 15,
    duration: 14,
    requirements: { minBalance: 200, minDays: 7 }
  },
  {
    id: 'premium-loan',
    amount: 5000,
    interestRate: 20,
    duration: 30,
    requirements: { minBalance: 1000, minDays: 14 }
  }
]

const MOMOBank: React.FC = () => {
  useSEO({
    title: 'どんぐり銀行',
    description: 'MOMOPayの預金・投資・融資サービス。どんぐりのように資産をコツコツ増やし、森の恵みで豊かになろう。利息・投資・融資の総合金融サービス。',
    keywords: 'どんぐり銀行,MOMOBank,銀行,預金,投資,融資,利息,資産運用,MOMOPay,森の経済',
    ogTitle: 'どんぐり銀行 | モモンガカーニバル',
    ogDescription: 'どんぐりのように資産をコツコツ増やそう！預金・投資・融資の総合金融サービス。'
  });

  const { momoPayPoints, addMomoPayPoints, spendMomoPayPoints } = useAppData()
  const [activeTab, setActiveTab] = useState<'account' | 'investment' | 'loan'>('account')
  const [bankAccount, setBankAccount] = useState<BankAccount>({
    balance: 0,
    interestRate: 1, // 1% per day
    lastUpdate: new Date().toISOString().split('T')[0]!,
    accountType: 'basic'
  })
  const [investments, setInvestments] = useState<UserInvestment[]>([])
  const [currentLoans, setCurrentLoans] = useState<LoanOffer[]>([])

  // Track area visit
  useEffect(() => {
    trackAreaVisited(AREAS.GAMES)
  }, [])

  // Load bank data
  useEffect(() => {
    loadBankData()
    updateDailyInterest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadBankData = () => {
    try {
      const savedAccount = localStorage.getItem('momo-bank-account')
      if (savedAccount) {
        setBankAccount(JSON.parse(savedAccount))
      }

      const savedInvestments = localStorage.getItem('momo-bank-investments')
      if (savedInvestments) {
        setInvestments(JSON.parse(savedInvestments))
      }

      const savedLoans = localStorage.getItem('momo-bank-loans')
      if (savedLoans) {
        setCurrentLoans(JSON.parse(savedLoans))
      }
    } catch (error) {
      console.error('Failed to load bank data:', error)
    }
  }

  const saveBankData = (account: BankAccount, userInvestments: UserInvestment[], loans: LoanOffer[]) => {
    try {
      localStorage.setItem('momo-bank-account', JSON.stringify(account))
      localStorage.setItem('momo-bank-investments', JSON.stringify(userInvestments))
      localStorage.setItem('momo-bank-loans', JSON.stringify(loans))
    } catch (error) {
      console.error('Failed to save bank data:', error)
    }
  }

  // 実際のリターンを計算（ランダム変動付き）
  const calculateActualReturn = (amount: number, expectedReturnPercent: number, risk: 'low' | 'medium' | 'high') => {
    // リスクレベルに応じた変動幅
    const volatility = {
      low: 0.2,    // ±20%の変動
      medium: 0.5, // ±50%の変動
      high: 0.8    // ±80%の変動
    }
    
    const baseReturn = expectedReturnPercent / 100
    const maxVariation = volatility[risk]
    
    // -maxVariation から +maxVariation の範囲でランダム変動
    const randomFactor = (Math.random() - 0.5) * 2 * maxVariation
    const actualReturnPercent = baseReturn * (1 + randomFactor)
    
    // 最悪でも元本の30%は残る（完全な損失を防ぐ）
    const minReturnPercent = -0.7
    const finalReturnPercent = Math.max(actualReturnPercent, minReturnPercent)
    
    const totalAmount = Math.floor(amount * (1 + finalReturnPercent))
    
    return {
      totalAmount,
      actualReturnPercent: finalReturnPercent * 100,
      profit: totalAmount - amount
    }
  }

  const updateDailyInterest = () => {
    const today = new Date().toISOString().split('T')[0]!
    
    if (bankAccount.lastUpdate !== today && bankAccount.balance > 0) {
      const interest = Math.floor(bankAccount.balance * (bankAccount.interestRate / 100))
      const newAccount: BankAccount = {
        ...bankAccount,
        balance: bankAccount.balance + interest,
        lastUpdate: today
      }
      setBankAccount(newAccount)
      
      if (interest > 0) {
        alert(`🏦 預金利息が付きました！\n+${interest}MOMOPay`)
      }
    }

    // Check matured investments
    const today_ms = new Date().getTime()
    const maturedInvestments = investments.filter(inv => {
      const endDate = new Date(inv.endDate).getTime()
      return endDate <= today_ms
    })

    if (maturedInvestments.length > 0) {
      let totalReturn = 0
      let resultMessages: string[] = []
      
      maturedInvestments.forEach(inv => {
        const investment = INVESTMENTS.find(i => i.id === inv.investmentId)!
        const actualReturn = calculateActualReturn(inv.amount, inv.expectedReturn, investment.risk)
        totalReturn += actualReturn.totalAmount
        resultMessages.push(`${investment.name}: ${actualReturn.totalAmount - inv.amount > 0 ? '+' : ''}${actualReturn.totalAmount - inv.amount}P (${actualReturn.actualReturnPercent.toFixed(1)}%)`)
      })
      
      const remainingInvestments = investments.filter(inv => {
        const endDate = new Date(inv.endDate).getTime()
        return endDate > today_ms
      })
      
      setInvestments(remainingInvestments)
      
      const newAccount: BankAccount = {
        ...bankAccount,
        balance: bankAccount.balance + totalReturn
      }
      setBankAccount(newAccount)
      
      const totalInvested = maturedInvestments.reduce((sum, inv) => sum + inv.amount, 0)
      const totalProfit = totalReturn - totalInvested
      const profitIcon = totalProfit > 0 ? '📈' : totalProfit < 0 ? '📉' : '📊'
      
      alert(`${profitIcon} 投資が満期になりました！\n\n${resultMessages.join('\n')}\n\n投資額: ${totalInvested}P\n受取額: ${totalReturn}P\n損益: ${totalProfit > 0 ? '+' : ''}${totalProfit}P`)
    }
  }

  const deposit = (amount: number) => {
    if (amount <= 0 || amount > momoPayPoints) {
      alert('預金額が無効です')
      return
    }

    if (spendMomoPayPoints(amount)) {
      const newAccount = {
        ...bankAccount,
        balance: bankAccount.balance + amount
      }
      setBankAccount(newAccount)
      saveBankData(newAccount, investments, currentLoans)
      alert(`💰 ${amount}MOMOPayを預金しました`)
    }
  }

  const withdraw = (amount: number) => {
    if (amount <= 0 || amount > bankAccount.balance) {
      alert('出金額が無効です')
      return
    }

    const newAccount = {
      ...bankAccount,
      balance: bankAccount.balance - amount
    }
    setBankAccount(newAccount)
    addMomoPayPoints(amount)
    saveBankData(newAccount, investments, currentLoans)
    alert(`💸 ${amount}MOMOPayを出金しました`)
  }

  const invest = (investment: Investment, amount: number) => {
    if (amount < investment.minInvestment || amount > momoPayPoints) {
      alert('投資額が無効です')
      return
    }

    if (spendMomoPayPoints(amount)) {
      const startDate = new Date()
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + investment.duration)

      const newInvestment: UserInvestment = {
        investmentId: investment.id,
        amount,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        expectedReturn: investment.expectedReturn * investment.duration
      }

      const updatedInvestments = [...investments, newInvestment]
      setInvestments(updatedInvestments)
      saveBankData(bankAccount, updatedInvestments, currentLoans)
      
      alert(`📊 ${investment.name}に${amount}MOMOPayを投資しました！\n満期: ${investment.duration}日後\n予想リターン: ${Math.floor(amount * (investment.expectedReturn * investment.duration / 100))}MOMOPay`)
    }
  }

  const takeLoan = (loan: LoanOffer) => {
    const accountAge = calculateAccountAge()
    
    if (bankAccount.balance < loan.requirements.minBalance) {
      alert(`預金残高が不足しています（必要: ${loan.requirements.minBalance}MOMOPay）`)
      return
    }
    
    if (accountAge < loan.requirements.minDays) {
      alert(`口座開設から${loan.requirements.minDays}日必要です（現在: ${accountAge}日）`)
      return
    }

    const interest = Math.floor(loan.amount * (loan.interestRate / 100))
    const totalRepayment = loan.amount + interest
    
    if (confirm(`💳 融資を受けますか？\n\n融資額: ${loan.amount}MOMOPay\n金利: ${loan.interestRate}%\n返済額: ${totalRepayment}MOMOPay\n返済期限: ${loan.duration}日後`)) {
      addMomoPayPoints(loan.amount)
      
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + loan.duration)
      
      const newLoan = {
        ...loan,
        totalRepayment,
        dueDate: dueDate.toISOString(),
        taken: true
      }
      
      const updatedLoans = [...currentLoans, newLoan]
      setCurrentLoans(updatedLoans)
      saveBankData(bankAccount, investments, updatedLoans)
      
      alert(`✅ 融資が実行されました！\n+${loan.amount}MOMOPay`)
    }
  }

  const calculateAccountAge = (): number => {
    const today = new Date()
    const accountCreated = new Date(bankAccount.lastUpdate)
    const diffTime = Math.abs(today.getTime() - accountCreated.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'low': return '#4caf50'
      case 'medium': return '#ff9800'
      case 'high': return '#f44336'
      default: return '#666'
    }
  }

  const getTotalAssets = (): number => {
    const investmentValue = investments.reduce((total, inv) => total + inv.amount, 0)
    return momoPayPoints + bankAccount.balance + investmentValue
  }

  return (
    <div style={{ color: 'white', textAlign: 'center', padding: 'min(40px, 8vw) min(20px, 4vw)' }}>
      <div className="comic-text font-title-lg" style={{ 
        marginBottom: 'min(16px, 4vw)', 
        textShadow: '3px 3px 0px #2e7d32, 6px 6px 0px #1b5e20, 0 0 15px rgba(255,255,255,0.3)', 
        color: '#fff3e0', 
        lineHeight: '1.2' 
      }}>
        🌰 どんぐり銀行 🏦
      </div>
      
      <div className="comic-text font-body-lg" style={{ 
        marginBottom: 'min(24px, 6vw)', 
        color: '#c8e6c9'
      }}>
        どんぐりのように資産をコツコツ増やそう！
      </div>

      {/* 資産サマリー */}
      <div className="comic-card" style={{
        background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 152, 0, 0.2))',
        borderColor: '#ffc107',
        padding: 'min(20px, 5vw)',
        marginBottom: 'min(24px, 6vw)',
        maxWidth: '800px',
        margin: '0 auto min(24px, 6vw) auto'
      }}>
        <div className="comic-text font-title-sm" style={{ 
          color: '#fff3e0',
          marginBottom: '12px'
        }}>
          💎 総資産: {getTotalAssets()}MOMOPay
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: 'min(12px, 3vw)' 
        }}>
          <div className="comic-text font-body-sm" style={{ color: '#c8e6c9' }}>
            💰 現金<br />{momoPayPoints}P
          </div>
          <div className="comic-text font-body-sm" style={{ color: '#c8e6c9' }}>
            🏦 預金<br />{bankAccount.balance}P
          </div>
          <div className="comic-text font-body-sm" style={{ color: '#c8e6c9' }}>
            📈 投資<br />{investments.reduce((total, inv) => total + inv.amount, 0)}P
          </div>
          <div className="comic-text font-body-sm" style={{ color: '#c8e6c9' }}>
            💳 借入<br />{currentLoans.length}件
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 10px' }}>
        {/* タブ */}
        <div className="bank-tabs" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 'min(16px, 4vw)', 
          marginBottom: 'min(32px, 8vw)',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'account', label: '🏦 預金', desc: '利息で増える' },
            { id: 'investment', label: '📈 投資', desc: 'リターンを狙う' },
            { id: 'loan', label: '💳 融資', desc: '資金調達' }
            ].map((tab: { id: string; label: string; desc: string }) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'account' | 'investment' | 'loan')}
              className="comic-button font-button-md"
              style={{
                background: activeTab === tab.id 
                  ? 'linear-gradient(45deg, #ffc107, #ffb300)' 
                  : 'linear-gradient(45deg, #666, #555)',
                color: activeTab === tab.id ? '#000' : '#ccc',
                borderColor: activeTab === tab.id ? '#f57f17' : '#333',
                transform: activeTab === tab.id ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <span>{tab.label}</span>
              <span style={{ fontSize: '0.7em', opacity: 0.8 }}>{tab.desc}</span>
            </button>
          ))}
        </div>

        {/* 預金タブ */}
        {activeTab === 'account' && (
          <div>
            <div className="comic-card" style={{
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(139, 195, 74, 0.1))',
              borderColor: '#8bc34a',
              padding: 'min(24px, 6vw)',
              marginBottom: 'min(24px, 6vw)'
            }}>
              <div className="comic-text font-title-sm" style={{ 
                color: '#fff3e0',
                marginBottom: '16px'
              }}>
                💰 預金口座
              </div>
              <div className="comic-text font-body-lg" style={{ 
                color: '#c8e6c9',
                marginBottom: '16px'
              }}>
                残高: {bankAccount.balance}MOMOPay
              </div>
              <div className="comic-text font-body-sm" style={{ 
                color: '#c8e6c9',
                marginBottom: '24px'
              }}>
                利率: {bankAccount.interestRate}%/日 | 最終更新: {bankAccount.lastUpdate}
              </div>
              
              <div className="bank-form-container" style={{ 
                display: 'flex', 
                gap: 'min(16px, 4vw)', 
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <div>
                  <input
                    type="number"
                    placeholder="預金額"
                    id="deposit-input"
                    className="comic-input font-body-md"
                    style={{
                      width: 'min(120px, 30vw)',
                      marginBottom: '8px',
                      textAlign: 'center'
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const amount = parseInt((e.target as HTMLInputElement).value)
                        if (amount > 0) {
                          deposit(amount)
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }
                    }}
                  />
                  <div>
                    <button
                      onClick={() => {
                        const input = document.getElementById('deposit-input') as HTMLInputElement
                        const amount = parseInt(input.value || '0')
                        if (amount > 0) {
                          deposit(amount)
                          input.value = ''
                        }
                      }}
                      className="comic-button font-button-sm"
                      style={{
                        background: 'linear-gradient(45deg, #4caf50, #45a049)',
                        color: 'white',
                        borderColor: '#2e7d32'
                      }}
                    >
                      預金
                    </button>
                  </div>
                </div>
                
                <div>
                  <input
                    type="number"
                    placeholder="出金額"
                    id="withdraw-input"
                    className="comic-input font-body-md"
                    style={{
                      width: 'min(120px, 30vw)',
                      marginBottom: '8px',
                      textAlign: 'center'
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const amount = parseInt((e.target as HTMLInputElement).value)
                        if (amount > 0) {
                          withdraw(amount)
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }
                    }}
                  />
                  <div>
                    <button
                      onClick={() => {
                        const input = document.getElementById('withdraw-input') as HTMLInputElement
                        const amount = parseInt(input.value || '0')
                        if (amount > 0) {
                          withdraw(amount)
                          input.value = ''
                        }
                      }}
                      className="comic-button font-button-sm"
                      style={{
                        background: 'linear-gradient(45deg, #ff9800, #f57c00)',
                        color: 'white',
                        borderColor: '#e65100'
                      }}
                    >
                      出金
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 投資タブ */}
        {activeTab === 'investment' && (
          <div>
            {/* 現在の投資 */}
            {investments.length > 0 && (
              <div className="comic-card" style={{
                background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.2), rgba(30, 136, 229, 0.1))',
                borderColor: '#2196f3',
                padding: 'min(20px, 5vw)',
                marginBottom: 'min(24px, 6vw)'
              }}>
                <div className="comic-text font-title-sm" style={{ 
                  color: '#fff3e0',
                  marginBottom: '16px'
                }}>
                  📊 現在の投資
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: 'min(12px, 3vw)' 
                }}>
                  {investments.map((inv, index) => {
                    const investment = INVESTMENTS.find(i => i.id === inv.investmentId)!
                    const endDate = new Date(inv.endDate)
                    const now = new Date()
                    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                    const expectedValue = inv.amount + Math.floor(inv.amount * (inv.expectedReturn / 100))
                    
                    return (
                      <div key={index} className="comic-card" style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderColor: getRiskColor(investment.risk),
                        padding: '12px'
                      }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
                          {investment.icon}
                        </div>
                        <div className="comic-text font-body-sm" style={{ color: '#fff3e0', marginBottom: '4px' }}>
                          {investment.name}
                        </div>
                        <div className="comic-text font-body-xs" style={{ color: '#c8e6c9', marginBottom: '4px' }}>
                          投資額: {inv.amount}P
                        </div>
                        <div className="comic-text font-body-xs" style={{ color: '#c8e6c9', marginBottom: '4px' }}>
                          予想: {expectedValue}P
                        </div>
                        <div className="comic-text font-body-xs" style={{ color: daysLeft > 0 ? '#ffc107' : '#4caf50' }}>
                          {daysLeft > 0 ? `${daysLeft}日後満期` : '満期！'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 投資リスク説明 */}
            <div className="comic-card" style={{
              background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.2), rgba(255, 111, 0, 0.1))',
              borderColor: '#ff9800',
              padding: 'min(16px, 4vw)',
              marginBottom: 'min(24px, 6vw)'
            }}>
              <div className="comic-text font-title-sm" style={{ color: '#fff3e0', marginBottom: '12px' }}>
                ⚠️ 投資リスク説明
              </div>
              <div className="comic-text font-body-sm" style={{ color: '#c8e6c9', textAlign: 'left', lineHeight: '1.6' }}>
                • 投資には元本割れのリスクがあります<br/>
                • 高リスク商品ほど大きな損失の可能性があります<br/>
                • 期待リターンは目安であり、実際の結果は変動します<br/>
                • 余裕資金での投資をおすすめします
              </div>
            </div>

            {/* 投資商品 */}
            <div className="investment-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 90vw), 1fr))', 
              gap: 'min(20px, 5vw)'
            }}>
              {INVESTMENTS.map((investment) => (
                <div key={investment.id} className="comic-card" style={{
                  background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.2), rgba(123, 31, 162, 0.1))',
                  borderColor: getRiskColor(investment.risk),
                  padding: 'min(20px, 5vw)'
                }}>
                  <div style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', marginBottom: '12px' }}>
                    {investment.icon}
                  </div>
                  <div className="comic-text font-title-sm" style={{ 
                    color: '#fff3e0',
                    marginBottom: '8px'
                  }}>
                    {investment.name}
                  </div>
                  <div className="comic-text font-body-sm" style={{ 
                    color: '#c8e6c9',
                    marginBottom: '12px',
                    lineHeight: '1.4'
                  }}>
                    {investment.description}
                  </div>
                  <div className="comic-text font-body-sm" style={{ 
                    color: '#c8e6c9',
                    marginBottom: '12px'
                  }}>
                    最低投資額: {investment.minInvestment}P<br />
                    期待リターン: {investment.expectedReturn}%/日<br />
                    期間: {investment.duration}日<br />
                    リスク: <span style={{ color: getRiskColor(investment.risk) }}>{investment.risk.toUpperCase()}</span>
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <input
                      type="number"
                      placeholder={`最低${investment.minInvestment}P`}
                      id={`invest-input-${investment.id}`}
                      className="comic-input font-body-sm"
                      style={{ width: '100%', marginBottom: '8px' }}
                      min={investment.minInvestment}
                    />
                  </div>
                  
                  <button
                    onClick={() => {
                      const input = document.getElementById(`invest-input-${investment.id}`) as HTMLInputElement
                      const amount = parseInt(input.value || '0')
                      if (amount >= investment.minInvestment) {
                        invest(investment, amount)
                        input.value = ''
                      } else {
                        alert(`最低投資額は${investment.minInvestment}MOMOPayです`)
                      }
                    }}
                    className="comic-button font-button-sm"
                    style={{
                      background: 'linear-gradient(45deg, #9c27b0, #7b1fa2)',
                      color: 'white',
                      borderColor: '#4a148c',
                      width: '100%'
                    }}
                  >
                    投資する
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 融資タブ */}
        {activeTab === 'loan' && (
          <div>
            {currentLoans.length > 0 && (
              <div className="comic-card" style={{
                background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.2), rgba(233, 30, 99, 0.1))',
                borderColor: '#f44336',
                padding: 'min(20px, 5vw)',
                marginBottom: 'min(24px, 6vw)'
              }}>
                <div className="comic-text font-title-sm" style={{ 
                  color: '#fff3e0',
                  marginBottom: '16px'
                }}>
                  💳 現在の借入
                </div>
                <div className="comic-text font-body-sm" style={{ color: '#ffcdd2' }}>
                  返済期限にご注意ください
                </div>
              </div>
            )}

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 90vw), 1fr))', 
              gap: 'min(20px, 5vw)'
            }}>
              {LOAN_OFFERS.map((loan) => (
                <div key={loan.id} className="comic-card" style={{
                  background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.2), rgba(255, 152, 0, 0.1))',
                  borderColor: '#ffc107',
                  padding: 'min(20px, 5vw)'
                }}>
                  <div style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', marginBottom: '12px' }}>
                    💰
                  </div>
                  <div className="comic-text font-title-sm" style={{ 
                    color: '#fff3e0',
                    marginBottom: '8px'
                  }}>
                    {loan.amount}MOMOPay融資
                  </div>
                  <div className="comic-text font-body-sm" style={{ 
                    color: '#c8e6c9',
                    marginBottom: '12px',
                    lineHeight: '1.4'
                  }}>
                    金利: {loan.interestRate}%<br />
                    返済期限: {loan.duration}日<br />
                    返済額: {loan.amount + Math.floor(loan.amount * (loan.interestRate / 100))}P
                  </div>
                  <div className="comic-text font-body-xs" style={{ 
                    color: '#c8e6c9',
                    marginBottom: '16px',
                    lineHeight: '1.4'
                  }}>
                    条件:<br />
                    • 預金残高 {loan.requirements.minBalance}P以上<br />
                    • 口座開設から{loan.requirements.minDays}日以上
                  </div>
                  
                  <button
                    onClick={() => takeLoan(loan)}
                    disabled={bankAccount.balance < loan.requirements.minBalance || calculateAccountAge() < loan.requirements.minDays}
                    className="comic-button font-button-sm"
                    style={{
                      background: (bankAccount.balance >= loan.requirements.minBalance && calculateAccountAge() >= loan.requirements.minDays)
                        ? 'linear-gradient(45deg, #ffc107, #ffb300)'
                        : 'linear-gradient(45deg, #666, #555)',
                      color: (bankAccount.balance >= loan.requirements.minBalance && calculateAccountAge() >= loan.requirements.minDays) ? '#000' : '#ccc',
                      borderColor: (bankAccount.balance >= loan.requirements.minBalance && calculateAccountAge() >= loan.requirements.minDays) ? '#f57f17' : '#333',
                      width: '100%'
                    }}
                  >
                    融資を受ける
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ナビゲーション */}
      <div style={{ 
        display: 'flex', 
        gap: 'min(16px, 4vw)', 
        justifyContent: 'center', 
        flexWrap: 'wrap',
        marginTop: 'min(40px, 10vw)'
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button className="comic-button font-button-md" style={{
            background: 'linear-gradient(45deg, #4caf50, #45a049)',
            color: 'white',
            borderColor: '#2e7d32'
          }}>
            🏠 拠点に戻る
          </button>
        </Link>
      </div>
    </div>
  )
}

export default MOMOBank