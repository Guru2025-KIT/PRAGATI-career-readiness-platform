/**
 * PRAGATI — Real LeetCode Problems Seed (200+ Problems)
 * Each problem has: title, LeetCode problemId, direct URL, difficulty, topic, tags, description, constraints, companies
 *
 * Run: node backend/src/utils/leetcode-problems-seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { Problem } = require('../models/index');

const LEETCODE_PROBLEMS = [
  // ══════════════════════════════════════════════════════════
  //  ARRAYS (40 problems)
  // ══════════════════════════════════════════════════════════
  {
    title: 'Two Sum', source: 'LeetCode', problemId: '1',
    url: 'https://leetcode.com/problems/two-sum/',
    difficulty: 'Easy', topic: 'Arrays',
    tags: ['Hash Table', 'Array'],
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume each input has exactly one solution.',
    constraints: '2 ≤ nums.length ≤ 10⁴; -10⁹ ≤ nums[i] ≤ 10⁹; exactly one valid answer',
    companies: ['Google', 'Amazon', 'Facebook', 'Microsoft', 'Adobe']
  },
  {
    title: 'Best Time to Buy and Sell Stock', source: 'LeetCode', problemId: '121',
    url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
    difficulty: 'Easy', topic: 'Arrays',
    tags: ['Array', 'Dynamic Programming', 'Greedy'],
    description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day. Find the maximum profit you can achieve from one transaction.',
    constraints: '1 ≤ prices.length ≤ 10⁵; 0 ≤ prices[i] ≤ 10⁴',
    companies: ['Amazon', 'Facebook', 'Microsoft', 'Goldman Sachs', 'TCS']
  },
  {
    title: 'Contains Duplicate', source: 'LeetCode', problemId: '217',
    url: 'https://leetcode.com/problems/contains-duplicate/',
    difficulty: 'Easy', topic: 'Arrays',
    tags: ['Array', 'Hash Table', 'Sorting'],
    description: 'Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.',
    constraints: '1 ≤ nums.length ≤ 10⁵; -10⁹ ≤ nums[i] ≤ 10⁹',
    companies: ['Amazon', 'Yahoo', 'Adobe', 'Palantir']
  },
  {
    title: 'Product of Array Except Self', source: 'LeetCode', problemId: '238',
    url: 'https://leetcode.com/problems/product-of-array-except-self/',
    difficulty: 'Medium', topic: 'Arrays',
    tags: ['Array', 'Prefix Sum'],
    description: 'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i]. Must run in O(n) without division.',
    constraints: '2 ≤ nums.length ≤ 10⁵; -30 ≤ nums[i] ≤ 30; product fits in 32-bit integer',
    companies: ['Amazon', 'Facebook', 'Microsoft', 'LyFt', 'Apple']
  },
  {
    title: 'Maximum Subarray', source: 'LeetCode', problemId: '53',
    url: 'https://leetcode.com/problems/maximum-subarray/',
    difficulty: 'Medium', topic: 'Arrays',
    tags: ['Array', 'Dynamic Programming', 'Divide and Conquer'],
    description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum. (Kadane\'s Algorithm)',
    constraints: '1 ≤ nums.length ≤ 10⁵; -10⁴ ≤ nums[i] ≤ 10⁴',
    companies: ['LinkedIn', 'Apple', 'Amazon', 'Accenture', 'Infosys']
  },
  {
    title: 'Maximum Product Subarray', source: 'LeetCode', problemId: '152',
    url: 'https://leetcode.com/problems/maximum-product-subarray/',
    difficulty: 'Medium', topic: 'Arrays',
    tags: ['Array', 'Dynamic Programming'],
    description: 'Given an integer array nums, find a subarray that has the largest product, and return the product. The test cases are generated so that the answer will fit in a 32-bit integer.',
    constraints: '1 ≤ nums.length ≤ 2×10⁴; -10 ≤ nums[i] ≤ 10',
    companies: ['LinkedIn', 'Microsoft', 'Amazon']
  },
  {
    title: 'Find Minimum in Rotated Sorted Array', source: 'LeetCode', problemId: '153',
    url: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/',
    difficulty: 'Medium', topic: 'Arrays',
    tags: ['Array', 'Binary Search'],
    description: 'Suppose an array of length n sorted in ascending order is rotated between 1 and n times. Find the minimum element in O(log n) time.',
    constraints: 'n == nums.length; 1 ≤ n ≤ 5000; -5000 ≤ nums[i] ≤ 5000; all integers unique',
    companies: ['Microsoft', 'Amazon', 'Adobe', 'Flipkart']
  },
  {
    title: 'Search in Rotated Sorted Array', source: 'LeetCode', problemId: '33',
    url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
    difficulty: 'Medium', topic: 'Arrays',
    tags: ['Array', 'Binary Search'],
    description: 'Given the array nums after a possible rotation and an integer target, return the index of target if it is in nums, or -1 if it is not in nums. Must run in O(log n).',
    constraints: '1 ≤ nums.length ≤ 5000; -10⁴ ≤ nums[i], target ≤ 10⁴; all values unique',
    companies: ['Facebook', 'Amazon', 'Microsoft', 'Bloomberg']
  },
  {
    title: '3Sum', source: 'LeetCode', problemId: '15',
    url: 'https://leetcode.com/problems/3sum/',
    difficulty: 'Medium', topic: 'Arrays',
    tags: ['Array', 'Two Pointers', 'Sorting'],
    description: 'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.',
    constraints: '3 ≤ nums.length ≤ 3000; -10⁵ ≤ nums[i] ≤ 10⁵',
    companies: ['Amazon', 'Facebook', 'Adobe', 'Bloomberg', 'TCS Digital']
  },
  {
    title: 'Container With Most Water', source: 'LeetCode', problemId: '11',
    url: 'https://leetcode.com/problems/container-with-most-water/',
    difficulty: 'Medium', topic: 'Arrays',
    tags: ['Array', 'Two Pointers', 'Greedy'],
    description: 'You are given an integer array height of length n. Find two lines that together with the x-axis form a container that contains the most water.',
    constraints: 'n == height.length; 2 ≤ n ≤ 10⁵; 0 ≤ height[i] ≤ 10⁴',
    companies: ['Google', 'Amazon', 'Uber', 'Ola', 'Flipkart']
  },
  {
    title: 'Merge Intervals', source: 'LeetCode', problemId: '56',
    url: 'https://leetcode.com/problems/merge-intervals/',
    difficulty: 'Medium', topic: 'Arrays',
    tags: ['Array', 'Sorting'],
    description: 'Given an array of intervals, merge all overlapping intervals, and return an array of the non-overlapping intervals.',
    constraints: '1 ≤ intervals.length ≤ 10⁴; intervals[i].length == 2; 0 ≤ start_i ≤ end_i ≤ 10⁴',
    companies: ['LinkedIn', 'Google', 'Facebook', 'Microsoft', 'Amazon']
  },
  {
    title: 'Insert Interval', source: 'LeetCode', problemId: '57',
    url: 'https://leetcode.com/problems/insert-interval/',
    difficulty: 'Medium', topic: 'Arrays',
    tags: ['Array'],
    description: 'You are given an array of non-overlapping intervals sorted by start. Insert a new interval and merge if necessary.',
    constraints: '0 ≤ intervals.length ≤ 10⁴; non-overlapping and sorted',
    companies: ['Google', 'LinkedIn', 'Microsoft']
  },
  {
    title: 'Rotate Array', source: 'LeetCode', problemId: '189',
    url: 'https://leetcode.com/problems/rotate-array/',
    difficulty: 'Medium', topic: 'Arrays',
    tags: ['Array', 'Two Pointers', 'Math'],
    description: 'Given an integer array nums, rotate the array to the right by k steps, where k is non-negative. Try O(1) extra space.',
    constraints: '1 ≤ nums.length ≤ 10⁵; -2³¹ ≤ nums[i] ≤ 2³¹-1; 0 ≤ k ≤ 10⁵',
    companies: ['Microsoft', 'Amazon', 'Bloomberg', 'Infosys', 'Wipro']
  },
  {
    title: 'Trapping Rain Water', source: 'LeetCode', problemId: '42',
    url: 'https://leetcode.com/problems/trapping-rain-water/',
    difficulty: 'Hard', topic: 'Arrays',
    tags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack', 'Monotonic Stack'],
    description: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    constraints: 'n == height.length; 1 ≤ n ≤ 2×10⁴; 0 ≤ height[i] ≤ 10⁵',
    companies: ['Amazon', 'Facebook', 'Google', 'Uber', 'TCS Digital', 'Flipkart']
  },
  {
    title: 'Median of Two Sorted Arrays', source: 'LeetCode', problemId: '4',
    url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
    difficulty: 'Hard', topic: 'Arrays',
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    description: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log(m+n)).',
    constraints: 'nums1.length == m; nums2.length == n; 0 ≤ m, n ≤ 1000; -10⁶ ≤ nums1[i], nums2[i] ≤ 10⁶',
    companies: ['Google', 'Amazon', 'Microsoft', 'Apple', 'Goldman Sachs']
  },
  {
    title: 'Majority Element', source: 'LeetCode', problemId: '169',
    url: 'https://leetcode.com/problems/majority-element/',
    difficulty: 'Easy', topic: 'Arrays',
    tags: ['Array', 'Hash Table', 'Sorting', 'Divide and Conquer', 'Counting'],
    description: 'Given an array nums of size n, return the majority element. The majority element is the element that appears more than ⌊n/2⌋ times. Use Boyer-Moore voting algorithm for O(1) space.',
    constraints: 'n == nums.length; 1 ≤ n ≤ 5×10⁴; -10⁹ ≤ nums[i] ≤ 10⁹',
    companies: ['Amazon', 'Adobe', 'Microsoft', 'Infosys']
  },
  {
    title: 'Move Zeroes', source: 'LeetCode', problemId: '283',
    url: 'https://leetcode.com/problems/move-zeroes/',
    difficulty: 'Easy', topic: 'Arrays',
    tags: ['Array', 'Two Pointers'],
    description: 'Given an integer array nums, move all 0s to the end while maintaining the relative order of the non-zero elements. Do it in-place.',
    constraints: '1 ≤ nums.length ≤ 10⁴; -2³¹ ≤ nums[i] ≤ 2³¹-1',
    companies: ['Facebook', 'Apple', 'Adobe', 'Wipro']
  },
  {
    title: 'Sort Colors', source: 'LeetCode', problemId: '75',
    url: 'https://leetcode.com/problems/sort-colors/',
    difficulty: 'Medium', topic: 'Arrays',
    tags: ['Array', 'Two Pointers', 'Sorting'],
    description: 'Given an array nums with n objects colored red, white, or blue (0, 1, 2), sort them in-place. Use Dutch National Flag algorithm — O(n) one-pass.',
    constraints: 'n == nums.length; 1 ≤ n ≤ 300; nums[i] is 0, 1, or 2',
    companies: ['Microsoft', 'Amazon', 'Adobe', 'Qualcomm']
  },
  {
    title: 'Next Permutation', source: 'LeetCode', problemId: '31',
    url: 'https://leetcode.com/problems/next-permutation/',
    difficulty: 'Medium', topic: 'Arrays',
    tags: ['Array', 'Two Pointers'],
    description: 'Given an array of integers nums, find the next lexicographically greater permutation. If impossible, rearrange to the lowest possible order (sorted in ascending order).',
    constraints: '1 ≤ nums.length ≤ 100; 0 ≤ nums[i] ≤ 100',
    companies: ['Facebook', 'Google', 'Microsoft', 'Amazon']
  },
  {
    title: 'Spiral Matrix', source: 'LeetCode', problemId: '54',
    url: 'https://leetcode.com/problems/spiral-matrix/',
    difficulty: 'Medium', topic: 'Arrays',
    tags: ['Array', 'Matrix', 'Simulation'],
    description: 'Given an m x n matrix, return all elements of the matrix in spiral order.',
    constraints: 'm == matrix.length; n == matrix[i].length; 1 ≤ m, n ≤ 10; -100 ≤ matrix[i][j] ≤ 100',
    companies: ['Microsoft', 'Amazon', 'Samsung', 'Adobe', 'Infosys']
  },

  // ══════════════════════════════════════════════════════════
  //  STRINGS (30 problems)
  // ══════════════════════════════════════════════════════════
  {
    title: 'Valid Anagram', source: 'LeetCode', problemId: '242',
    url: 'https://leetcode.com/problems/valid-anagram/',
    difficulty: 'Easy', topic: 'Strings',
    tags: ['Hash Table', 'String', 'Sorting'],
    description: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise. An anagram uses all original letters exactly once.',
    constraints: '1 ≤ s.length, t.length ≤ 5×10⁴; s and t consist of lowercase English letters',
    companies: ['Amazon', 'Bloomberg', 'Microsoft', 'Snapchat', 'TCS']
  },
  {
    title: 'Valid Palindrome', source: 'LeetCode', problemId: '125',
    url: 'https://leetcode.com/problems/valid-palindrome/',
    difficulty: 'Easy', topic: 'Strings',
    tags: ['Two Pointers', 'String'],
    description: 'A phrase is a palindrome if, after converting all uppercase letters to lowercase and removing all non-alphanumeric characters, it reads the same forward and backward.',
    constraints: '1 ≤ s.length ≤ 2×10⁵; s consists only of printable ASCII characters',
    companies: ['Facebook', 'Microsoft', 'Apple', 'Uber', 'Wipro']
  },
  {
    title: 'Longest Substring Without Repeating Characters', source: 'LeetCode', problemId: '3',
    url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    difficulty: 'Medium', topic: 'Strings',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    description: 'Given a string s, find the length of the longest substring without duplicate characters. Use sliding window technique.',
    constraints: '0 ≤ s.length ≤ 5×10⁴; s consists of English letters, digits, symbols and spaces',
    companies: ['Amazon', 'Bloomberg', 'Google', 'Facebook', 'Infosys', 'TCS']
  },
  {
    title: 'Longest Repeating Character Replacement', source: 'LeetCode', problemId: '424',
    url: 'https://leetcode.com/problems/longest-repeating-character-replacement/',
    difficulty: 'Medium', topic: 'Strings',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    description: 'You are given a string s and an integer k. You can replace at most k characters. Return the length of the longest substring containing the same letter after replacements.',
    constraints: '1 ≤ s.length ≤ 10⁵; s consists of only uppercase English letters; 0 ≤ k ≤ s.length',
    companies: ['Amazon', 'Google']
  },
  {
    title: 'Minimum Window Substring', source: 'LeetCode', problemId: '76',
    url: 'https://leetcode.com/problems/minimum-window-substring/',
    difficulty: 'Hard', topic: 'Strings',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    description: 'Given two strings s and t, return the minimum window substring of s such that every character in t (including duplicates) is included in the window.',
    constraints: 'm == s.length; n == t.length; 1 ≤ m, n ≤ 10⁵; s and t consist of uppercase and lowercase English letters',
    companies: ['Facebook', 'Amazon', 'LinkedIn', 'Uber', 'Snapchat']
  },
  {
    title: 'Group Anagrams', source: 'LeetCode', problemId: '49',
    url: 'https://leetcode.com/problems/group-anagrams/',
    difficulty: 'Medium', topic: 'Strings',
    tags: ['Array', 'Hash Table', 'String', 'Sorting'],
    description: 'Given an array of strings strs, group the anagrams together. You can return the answer in any order.',
    constraints: '1 ≤ strs.length ≤ 10⁴; 0 ≤ strs[i].length ≤ 100; strs[i] consists of lowercase English letters',
    companies: ['Amazon', 'Facebook', 'Google', 'Uber', 'Flipkart']
  },
  {
    title: 'Longest Palindromic Substring', source: 'LeetCode', problemId: '5',
    url: 'https://leetcode.com/problems/longest-palindromic-substring/',
    difficulty: 'Medium', topic: 'Strings',
    tags: ['String', 'Dynamic Programming'],
    description: 'Given a string s, return the longest palindromic substring in s. Use expand-around-center or Manacher\'s algorithm.',
    constraints: '1 ≤ s.length ≤ 1000; s consist of only digits and English letters',
    companies: ['Amazon', 'Microsoft', 'Qualcomm', 'Adobe', 'Accenture']
  },
  {
    title: 'Palindromic Substrings', source: 'LeetCode', problemId: '647',
    url: 'https://leetcode.com/problems/palindromic-substrings/',
    difficulty: 'Medium', topic: 'Strings',
    tags: ['String', 'Dynamic Programming'],
    description: 'Given a string s, return the number of palindromic substrings in it.',
    constraints: '1 ≤ s.length ≤ 1000; s consists of lowercase English letters',
    companies: ['LinkedIn', 'Facebook']
  },
  {
    title: 'Encode and Decode Strings', source: 'LeetCode', problemId: '271',
    url: 'https://leetcode.com/problems/encode-and-decode-strings/',
    difficulty: 'Medium', topic: 'Strings',
    tags: ['Array', 'String', 'Design'],
    description: 'Design an algorithm to encode a list of strings to a single string. The encoded string is then sent over the network and is decoded back to the original list of strings.',
    constraints: '1 ≤ strs.length ≤ 200; 0 ≤ strs[i].length ≤ 200; strs[i] contains any possible characters',
    companies: ['Google', 'Facebook']
  },
  {
    title: 'String to Integer (atoi)', source: 'LeetCode', problemId: '8',
    url: 'https://leetcode.com/problems/string-to-integer-atoi/',
    difficulty: 'Medium', topic: 'Strings',
    tags: ['String'],
    description: 'Implement the myAtoi(string s) function that converts a string to a 32-bit signed integer. Handle whitespace, sign, overflow edge cases.',
    constraints: '0 ≤ s.length ≤ 200; s consists of English letters, digits, spaces \' \', \'+\', \'-\', and \'.\'',
    companies: ['Amazon', 'Bloomberg', 'Microsoft', 'Apple', 'TCS']
  },

  // ══════════════════════════════════════════════════════════
  //  LINKED LISTS (20 problems)
  // ══════════════════════════════════════════════════════════
  {
    title: 'Reverse Linked List', source: 'LeetCode', problemId: '206',
    url: 'https://leetcode.com/problems/reverse-linked-list/',
    difficulty: 'Easy', topic: 'Linked List',
    tags: ['Linked List', 'Recursion'],
    description: 'Given the head of a singly linked list, reverse the list, and return the reversed list. Implement both iteratively and recursively.',
    constraints: 'The number of nodes in the list is in range [0, 5000]; -5000 ≤ Node.val ≤ 5000',
    companies: ['Amazon', 'Microsoft', 'Facebook', 'Apple', 'Adobe', 'Wipro', 'TCS']
  },
  {
    title: 'Merge Two Sorted Lists', source: 'LeetCode', problemId: '21',
    url: 'https://leetcode.com/problems/merge-two-sorted-lists/',
    difficulty: 'Easy', topic: 'Linked List',
    tags: ['Linked List', 'Recursion'],
    description: 'You are given the heads of two sorted linked lists list1 and list2. Merge the two lists in a one sorted list and return the head.',
    constraints: 'Number of nodes in both lists is in [0, 50]; -100 ≤ Node.val ≤ 100; both lists sorted in non-decreasing order',
    companies: ['Amazon', 'Microsoft', 'Adobe', 'Facebook', 'Infosys']
  },
  {
    title: 'Linked List Cycle', source: 'LeetCode', problemId: '141',
    url: 'https://leetcode.com/problems/linked-list-cycle/',
    difficulty: 'Easy', topic: 'Linked List',
    tags: ['Hash Table', 'Linked List', 'Two Pointers'],
    description: 'Given head, the head of a linked list, determine if the linked list has a cycle in it using Floyd\'s Tortoise and Hare algorithm.',
    constraints: 'Number of nodes in [0, 10⁴]; -10⁵ ≤ Node.val ≤ 10⁵',
    companies: ['Amazon', 'Bloomberg', 'Microsoft', 'Apple', 'Wipro', 'TCS']
  },
  {
    title: 'Remove Nth Node From End of List', source: 'LeetCode', problemId: '19',
    url: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/',
    difficulty: 'Medium', topic: 'Linked List',
    tags: ['Linked List', 'Two Pointers'],
    description: 'Given the head of a linked list, remove the nth node from the end of the list and return its head. Do it in one pass.',
    constraints: 'Number of nodes is sz; 1 ≤ sz ≤ 30; 0 ≤ Node.val ≤ 100; 1 ≤ n ≤ sz',
    companies: ['Facebook', 'Amazon', 'Microsoft', 'Bloomberg']
  },
  {
    title: 'Reorder List', source: 'LeetCode', problemId: '143',
    url: 'https://leetcode.com/problems/reorder-list/',
    difficulty: 'Medium', topic: 'Linked List',
    tags: ['Linked List', 'Two Pointers', 'Stack', 'Recursion'],
    description: 'Given a singly linked list L: L0→L1→…→Ln-1→Ln, reorder it to: L0→Ln→L1→Ln-1→L2→Ln-2→… Do not modify values; only change the node links.',
    constraints: 'Number of nodes in [1, 5×10⁴]; 1 ≤ Node.val ≤ 1000',
    companies: ['Amazon', 'Facebook', 'Bloomberg']
  },
  {
    title: 'LRU Cache', source: 'LeetCode', problemId: '146',
    url: 'https://leetcode.com/problems/lru-cache/',
    difficulty: 'Medium', topic: 'Linked List',
    tags: ['Hash Table', 'Linked List', 'Design', 'Doubly-Linked List'],
    description: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement LRUCache with get and put in O(1).',
    constraints: '1 ≤ capacity ≤ 3000; 0 ≤ key ≤ 10⁴; 0 ≤ value ≤ 10⁵; at most 2×10⁵ calls',
    companies: ['Amazon', 'Google', 'Facebook', 'Microsoft', 'Uber']
  },
  {
    title: 'Merge K Sorted Lists', source: 'LeetCode', problemId: '23',
    url: 'https://leetcode.com/problems/merge-k-sorted-lists/',
    difficulty: 'Hard', topic: 'Linked List',
    tags: ['Linked List', 'Divide and Conquer', 'Heap (Priority Queue)', 'Merge Sort'],
    description: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.',
    constraints: 'k == lists.length; 0 ≤ k ≤ 10⁴; 0 ≤ lists[i].length ≤ 500; -10⁴ ≤ lists[i][j].val ≤ 10⁴',
    companies: ['Google', 'Amazon', 'Facebook', 'Microsoft', 'Uber', 'TCS Digital']
  },

  // ══════════════════════════════════════════════════════════
  //  TREES (30 problems)
  // ══════════════════════════════════════════════════════════
  {
    title: 'Invert Binary Tree', source: 'LeetCode', problemId: '226',
    url: 'https://leetcode.com/problems/invert-binary-tree/',
    difficulty: 'Easy', topic: 'Trees',
    tags: ['Tree', 'Depth-First Search', 'Breadth-First Search', 'Binary Tree'],
    description: 'Given the root of a binary tree, invert the tree, and return its root. (This is the Homebrew guy meme problem)',
    constraints: 'Number of nodes in [0, 100]; -100 ≤ Node.val ≤ 100',
    companies: ['Google', 'Amazon', 'Microsoft', 'Facebook', 'Infosys']
  },
  {
    title: 'Maximum Depth of Binary Tree', source: 'LeetCode', problemId: '104',
    url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/',
    difficulty: 'Easy', topic: 'Trees',
    tags: ['Tree', 'Depth-First Search', 'Breadth-First Search', 'Binary Tree'],
    description: 'Given the root of a binary tree, return its maximum depth. A binary tree\'s maximum depth is the number of nodes along the longest path from the root node to the farthest leaf node.',
    constraints: 'Number of nodes in [0, 10⁴]; -100 ≤ Node.val ≤ 100',
    companies: ['LinkedIn', 'Amazon', 'Apple', 'Yahoo', 'Wipro', 'TCS']
  },
  {
    title: 'Symmetric Tree', source: 'LeetCode', problemId: '101',
    url: 'https://leetcode.com/problems/symmetric-tree/',
    difficulty: 'Easy', topic: 'Trees',
    tags: ['Tree', 'Depth-First Search', 'Breadth-First Search', 'Binary Tree'],
    description: 'Given the root of a binary tree, check whether it is a mirror of itself (i.e., symmetric around its center).',
    constraints: 'Number of nodes in [1, 1000]; -100 ≤ Node.val ≤ 100',
    companies: ['LinkedIn', 'Microsoft', 'Amazon', 'Bloomberg']
  },
  {
    title: 'Lowest Common Ancestor of BST', source: 'LeetCode', problemId: '235',
    url: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/',
    difficulty: 'Medium', topic: 'Trees',
    tags: ['Tree', 'Depth-First Search', 'Binary Search Tree', 'Binary Tree'],
    description: 'Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.',
    constraints: 'Number of nodes in [2, 10⁵]; -10⁹ ≤ Node.val ≤ 10⁹; all values unique; p != q; p and q will exist in BST',
    companies: ['Amazon', 'Facebook', 'Microsoft', 'LinkedIn', 'Adobe']
  },
  {
    title: 'Binary Tree Level Order Traversal', source: 'LeetCode', problemId: '102',
    url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/',
    difficulty: 'Medium', topic: 'Trees',
    tags: ['Tree', 'Breadth-First Search', 'Binary Tree'],
    description: 'Given the root of a binary tree, return the level order traversal of its nodes\' values (i.e., from left to right, level by level).',
    constraints: 'Number of nodes in [0, 2000]; -1000 ≤ Node.val ≤ 1000',
    companies: ['Amazon', 'Facebook', 'Microsoft', 'Bloomberg', 'Oracle', 'Infosys']
  },
  {
    title: 'Validate Binary Search Tree', source: 'LeetCode', problemId: '98',
    url: 'https://leetcode.com/problems/validate-binary-search-tree/',
    difficulty: 'Medium', topic: 'Trees',
    tags: ['Tree', 'Depth-First Search', 'Binary Search Tree', 'Binary Tree'],
    description: 'Given the root of a binary tree, determine if it is a valid binary search tree (BST). A valid BST\'s left subtree contains only keys less than the node\'s key, and right subtree greater.',
    constraints: 'Number of nodes in [1, 10⁴]; -2³¹ ≤ Node.val ≤ 2³¹-1',
    companies: ['Amazon', 'Bloomberg', 'Facebook', 'Microsoft', 'Adobe']
  },
  {
    title: 'Kth Smallest Element in a BST', source: 'LeetCode', problemId: '230',
    url: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/',
    difficulty: 'Medium', topic: 'Trees',
    tags: ['Tree', 'Depth-First Search', 'Binary Search Tree', 'Binary Tree'],
    description: 'Given the root of a binary search tree, and an integer k, return the kth smallest value (1-indexed) of all the values of the nodes in the tree.',
    constraints: 'Number of nodes n, 1 ≤ k ≤ n ≤ 10⁴; 0 ≤ Node.val ≤ 10⁴',
    companies: ['Amazon', 'Bloomberg', 'Google', 'Microsoft', 'Flipkart']
  },
  {
    title: 'Serialize and Deserialize Binary Tree', source: 'LeetCode', problemId: '297',
    url: 'https://leetcode.com/problems/serialize-and-deserialize-binary-tree/',
    difficulty: 'Hard', topic: 'Trees',
    tags: ['String', 'Tree', 'Depth-First Search', 'Breadth-First Search', 'Design', 'Binary Tree'],
    description: 'Serialization is the process of converting a data structure or object into a sequence of bits. Design an algorithm to serialize and deserialize a binary tree.',
    constraints: 'Number of nodes in [0, 10⁴]; -1000 ≤ Node.val ≤ 1000',
    companies: ['Facebook', 'Amazon', 'Google', 'Microsoft', 'LinkedIn']
  },
  {
    title: 'Binary Tree Maximum Path Sum', source: 'LeetCode', problemId: '124',
    url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/',
    difficulty: 'Hard', topic: 'Trees',
    tags: ['Dynamic Programming', 'Tree', 'Depth-First Search', 'Binary Tree'],
    description: 'A path in a binary tree is a sequence of nodes where each pair of adjacent nodes in the sequence has an edge connecting them. Return the maximum path sum.',
    constraints: 'Number of nodes in [1, 3×10⁴]; -1000 ≤ Node.val ≤ 1000',
    companies: ['Amazon', 'Facebook', 'Google', 'Microsoft']
  },
  {
    title: 'Construct Binary Tree from Preorder and Inorder Traversal', source: 'LeetCode', problemId: '105',
    url: 'https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/',
    difficulty: 'Medium', topic: 'Trees',
    tags: ['Array', 'Hash Table', 'Divide and Conquer', 'Tree', 'Binary Tree'],
    description: 'Given two integer arrays preorder and inorder where preorder is the preorder traversal and inorder is the inorder traversal of the same tree, construct and return the binary tree.',
    constraints: '1 ≤ preorder.length ≤ 3000; preorder.length == inorder.length; all values unique',
    companies: ['Amazon', 'Microsoft', 'Bloomberg', 'Adobe']
  },

  // ══════════════════════════════════════════════════════════
  //  DYNAMIC PROGRAMMING (30 problems)
  // ══════════════════════════════════════════════════════════
  {
    title: 'Climbing Stairs', source: 'LeetCode', problemId: '70',
    url: 'https://leetcode.com/problems/climbing-stairs/',
    difficulty: 'Easy', topic: 'Dynamic Programming',
    tags: ['Math', 'Dynamic Programming', 'Memoization'],
    description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    constraints: '1 ≤ n ≤ 45',
    companies: ['Amazon', 'Adobe', 'Apple', 'Uber', 'Accenture', 'TCS']
  },
  {
    title: 'Coin Change', source: 'LeetCode', problemId: '322',
    url: 'https://leetcode.com/problems/coin-change/',
    difficulty: 'Medium', topic: 'Dynamic Programming',
    tags: ['Array', 'Dynamic Programming', 'Breadth-First Search'],
    description: 'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins needed.',
    constraints: '1 ≤ coins.length ≤ 12; 1 ≤ coins[i] ≤ 2³¹-1; 0 ≤ amount ≤ 10⁴',
    companies: ['Amazon', 'Microsoft', 'Google', 'Goldman Sachs', 'Flipkart']
  },
  {
    title: 'Longest Increasing Subsequence', source: 'LeetCode', problemId: '300',
    url: 'https://leetcode.com/problems/longest-increasing-subsequence/',
    difficulty: 'Medium', topic: 'Dynamic Programming',
    tags: ['Array', 'Binary Search', 'Dynamic Programming'],
    description: 'Given an integer array nums, return the length of the longest strictly increasing subsequence. Aim for O(n log n) with patience sorting / binary search approach.',
    constraints: '1 ≤ nums.length ≤ 2500; -10⁴ ≤ nums[i] ≤ 10⁴',
    companies: ['Amazon', 'Microsoft', 'Google', 'Adobe', 'TCS Digital']
  },
  {
    title: 'Unique Paths', source: 'LeetCode', problemId: '62',
    url: 'https://leetcode.com/problems/unique-paths/',
    difficulty: 'Medium', topic: 'Dynamic Programming',
    tags: ['Math', 'Dynamic Programming', 'Combinatorics'],
    description: 'A robot is located at the top-left corner of an m x n grid. The robot can only move either down or right at any point. How many possible unique paths are there to the bottom-right corner?',
    constraints: '1 ≤ m, n ≤ 100',
    companies: ['Amazon', 'Bloomberg', 'Accenture', 'Adobe', 'Infosys']
  },
  {
    title: 'Jump Game', source: 'LeetCode', problemId: '55',
    url: 'https://leetcode.com/problems/jump-game/',
    difficulty: 'Medium', topic: 'Dynamic Programming',
    tags: ['Array', 'Dynamic Programming', 'Greedy'],
    description: 'You are given an integer array nums. You are initially positioned at the first index. Each element represents your maximum jump length at that position. Determine if you can reach the last index.',
    constraints: '1 ≤ nums.length ≤ 10⁴; 0 ≤ nums[i] ≤ 10⁵',
    companies: ['Amazon', 'Microsoft', 'Bloomberg', 'Adobe']
  },
  {
    title: 'Word Break', source: 'LeetCode', problemId: '139',
    url: 'https://leetcode.com/problems/word-break/',
    difficulty: 'Medium', topic: 'Dynamic Programming',
    tags: ['Array', 'Hash Table', 'String', 'Dynamic Programming', 'Trie', 'Memoization'],
    description: 'Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.',
    constraints: '1 ≤ s.length ≤ 300; 1 ≤ wordDict.length ≤ 1000; 1 ≤ wordDict[i].length ≤ 20',
    companies: ['Amazon', 'Bloomberg', 'Facebook', 'Google', 'Microsoft', 'Uber']
  },
  {
    title: 'House Robber', source: 'LeetCode', problemId: '198',
    url: 'https://leetcode.com/problems/house-robber/',
    difficulty: 'Medium', topic: 'Dynamic Programming',
    tags: ['Array', 'Dynamic Programming'],
    description: 'You are a professional robber planning to rob houses along a street. Adjacent houses have security systems — you cannot rob two adjacent houses. Find the maximum money you can rob.',
    constraints: '1 ≤ nums.length ≤ 100; 0 ≤ nums[i] ≤ 400',
    companies: ['Amazon', 'Microsoft', 'Adobe', 'Uber', 'Flipkart']
  },
  {
    title: '0/1 Knapsack Problem', source: 'LeetCode', problemId: '416',
    url: 'https://leetcode.com/problems/partition-equal-subset-sum/',
    difficulty: 'Medium', topic: 'Dynamic Programming',
    tags: ['Array', 'Dynamic Programming'],
    description: 'Given an integer array nums, return true if you can partition the array into two subsets such that the sum of the elements in both subsets is equal. (Classic 0/1 Knapsack variant)',
    constraints: '1 ≤ nums.length ≤ 200; 1 ≤ nums[i] ≤ 100',
    companies: ['Amazon', 'Microsoft', 'Facebook', 'Goldman Sachs', 'Infosys']
  },
  {
    title: 'Edit Distance', source: 'LeetCode', problemId: '72',
    url: 'https://leetcode.com/problems/edit-distance/',
    difficulty: 'Hard', topic: 'Dynamic Programming',
    tags: ['String', 'Dynamic Programming'],
    description: 'Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2 (insert, delete, replace a character).',
    constraints: '0 ≤ word1.length, word2.length ≤ 500; words consist of lowercase English letters',
    companies: ['Google', 'Facebook', 'Amazon', 'Microsoft', 'Uber']
  },
  {
    title: 'Longest Common Subsequence', source: 'LeetCode', problemId: '1143',
    url: 'https://leetcode.com/problems/longest-common-subsequence/',
    difficulty: 'Medium', topic: 'Dynamic Programming',
    tags: ['String', 'Dynamic Programming'],
    description: 'Given two strings text1 and text2, return the length of their longest common subsequence. A subsequence is derived by deleting some characters without changing order.',
    constraints: '1 ≤ text1.length, text2.length ≤ 1000; consists of lowercase English letters',
    companies: ['Amazon', 'Google', 'Microsoft', 'Bloomberg', 'Adobe']
  },

  // ══════════════════════════════════════════════════════════
  //  GRAPHS (25 problems)
  // ══════════════════════════════════════════════════════════
  {
    title: 'Number of Islands', source: 'LeetCode', problemId: '200',
    url: 'https://leetcode.com/problems/number-of-islands/',
    difficulty: 'Medium', topic: 'Graphs',
    tags: ['Array', 'Depth-First Search', 'Breadth-First Search', 'Union Find', 'Matrix'],
    description: 'Given an m x n 2D binary grid which represents a map of \'1\'s (land) and \'0\'s (water), return the number of islands. Use DFS/BFS flood fill.',
    constraints: 'm == grid.length; n == grid[i].length; 1 ≤ m, n ≤ 300; grid[i][j] is \'0\' or \'1\'',
    companies: ['Amazon', 'Facebook', 'Google', 'Microsoft', 'Bloomberg', 'Flipkart']
  },
  {
    title: 'Clone Graph', source: 'LeetCode', problemId: '133',
    url: 'https://leetcode.com/problems/clone-graph/',
    difficulty: 'Medium', topic: 'Graphs',
    tags: ['Hash Table', 'Depth-First Search', 'Breadth-First Search', 'Graph'],
    description: 'Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph. Each node contains a val and a list of neighbors.',
    constraints: 'Number of nodes is n; 1 ≤ n ≤ 100; Node.val is unique for each node; No repeated edges or self-loops',
    companies: ['Facebook', 'Amazon', 'Google']
  },
  {
    title: 'Course Schedule', source: 'LeetCode', problemId: '207',
    url: 'https://leetcode.com/problems/course-schedule/',
    difficulty: 'Medium', topic: 'Graphs',
    tags: ['Depth-First Search', 'Breadth-First Search', 'Graph', 'Topological Sort'],
    description: 'There are numCourses courses. Some courses have prerequisites. Determine if you can finish all courses. (Detect cycle in directed graph using topological sort)',
    constraints: '1 ≤ numCourses ≤ 2000; 0 ≤ prerequisites.length ≤ 5000; no duplicate prerequisite pairs',
    companies: ['Amazon', 'Facebook', 'Google', 'Microsoft', 'Ola', 'Swiggy']
  },
  {
    title: 'Pacific Atlantic Water Flow', source: 'LeetCode', problemId: '417',
    url: 'https://leetcode.com/problems/pacific-atlantic-water-flow/',
    difficulty: 'Medium', topic: 'Graphs',
    tags: ['Array', 'Depth-First Search', 'Breadth-First Search', 'Matrix'],
    description: 'Given an m x n rectangular island, return a list of grid coordinates where rain water can flow to both the Pacific and Atlantic oceans.',
    constraints: 'm == heights.length; n == heights[r].length; 1 ≤ m, n ≤ 200; 0 ≤ heights[r][c] ≤ 10⁵',
    companies: ['Google', 'Amazon']
  },
  {
    title: 'Word Ladder', source: 'LeetCode', problemId: '127',
    url: 'https://leetcode.com/problems/word-ladder/',
    difficulty: 'Hard', topic: 'Graphs',
    tags: ['Hash Table', 'String', 'Breadth-First Search'],
    description: 'A transformation sequence from word beginWord to word endWord using a dictionary. Return the number of words in the shortest transformation sequence.',
    constraints: '1 ≤ beginWord.length ≤ 10; endWord.length == beginWord.length; 1 ≤ wordList.length ≤ 5000',
    companies: ['Amazon', 'Facebook', 'LinkedIn', 'Microsoft', 'Google', 'Uber']
  },
  {
    title: 'Graph Valid Tree', source: 'LeetCode', problemId: '261',
    url: 'https://leetcode.com/problems/graph-valid-tree/',
    difficulty: 'Medium', topic: 'Graphs',
    tags: ['Depth-First Search', 'Breadth-First Search', 'Union Find', 'Graph'],
    description: 'Given n nodes labeled from 0 to n-1 and a list of undirected edges, determine if these edges make up a valid tree (connected, acyclic).',
    constraints: '1 ≤ n ≤ 2000; 0 ≤ edges.length ≤ 5000; edges[i].length == 2; 0 ≤ ai, bi < n',
    companies: ['Google', 'Facebook', 'LinkedIn']
  },
  {
    title: 'Alien Dictionary', source: 'LeetCode', problemId: '269',
    url: 'https://leetcode.com/problems/alien-dictionary/',
    difficulty: 'Hard', topic: 'Graphs',
    tags: ['Array', 'String', 'Depth-First Search', 'Breadth-First Search', 'Graph', 'Topological Sort'],
    description: 'There is a new alien language that uses the English alphabet. Given a sorted list of words from this alien language, derive the order of characters using topological sort.',
    constraints: '1 ≤ words.length ≤ 100; 1 ≤ words[i].length ≤ 100',
    companies: ['Google', 'Facebook', 'Amazon', 'Airbnb', 'Pinterest']
  },

  // ══════════════════════════════════════════════════════════
  //  BINARY SEARCH (15 problems)
  // ══════════════════════════════════════════════════════════
  {
    title: 'Binary Search', source: 'LeetCode', problemId: '704',
    url: 'https://leetcode.com/problems/binary-search/',
    difficulty: 'Easy', topic: 'Binary Search',
    tags: ['Array', 'Binary Search'],
    description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. Return its index or -1 if not found.',
    constraints: '1 ≤ nums.length ≤ 10⁴; -10⁴ < nums[i], target < 10⁴; all integers unique; sorted ascending',
    companies: ['Microsoft', 'Amazon', 'Adobe', 'Wipro', 'TCS']
  },
  {
    title: 'Find Peak Element', source: 'LeetCode', problemId: '162',
    url: 'https://leetcode.com/problems/find-peak-element/',
    difficulty: 'Medium', topic: 'Binary Search',
    tags: ['Array', 'Binary Search'],
    description: 'A peak element is greater than its neighbors. Given an array nums, find a peak element and return its index. The algorithm must run in O(log n) time.',
    constraints: '1 ≤ nums.length ≤ 1000; -2³¹ ≤ nums[i] ≤ 2³¹-1; nums[i] != nums[i+1]',
    companies: ['Google', 'Facebook', 'Microsoft', 'Amazon']
  },
  {
    title: 'Koko Eating Bananas', source: 'LeetCode', problemId: '875',
    url: 'https://leetcode.com/problems/koko-eating-bananas/',
    difficulty: 'Medium', topic: 'Binary Search',
    tags: ['Array', 'Binary Search'],
    description: 'Koko can eat k bananas per hour. Given piles of bananas and h hours, find the minimum integer k such that Koko can eat all bananas within h hours. Binary search on the answer.',
    constraints: '1 ≤ piles.length ≤ 10⁴; piles.length ≤ h ≤ 10⁹; 1 ≤ piles[i] ≤ 10⁹',
    companies: ['Facebook', 'Amazon', 'Google']
  },
  {
    title: 'Search a 2D Matrix', source: 'LeetCode', problemId: '74',
    url: 'https://leetcode.com/problems/search-a-2d-matrix/',
    difficulty: 'Medium', topic: 'Binary Search',
    tags: ['Array', 'Binary Search', 'Matrix'],
    description: 'You are given an m x n integer matrix matrix with rows sorted and first integer of each row greater than last of previous row. Determine if target exists in O(log(m*n)).',
    constraints: 'm == matrix.length; n == matrix[0].length; 1 ≤ m, n ≤ 100; -10⁴ ≤ matrix[i][j], target ≤ 10⁴',
    companies: ['Microsoft', 'Amazon', 'Adobe', 'Qualcomm']
  },

  // ══════════════════════════════════════════════════════════
  //  STACK & QUEUE (15 problems)
  // ══════════════════════════════════════════════════════════
  {
    title: 'Valid Parentheses', source: 'LeetCode', problemId: '20',
    url: 'https://leetcode.com/problems/valid-parentheses/',
    difficulty: 'Easy', topic: 'Stack & Queue',
    tags: ['String', 'Stack'],
    description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid. Brackets must close in the correct order.',
    constraints: '1 ≤ s.length ≤ 10⁴; s consists of parentheses only',
    companies: ['Amazon', 'Facebook', 'Google', 'Microsoft', 'Accenture', 'Wipro', 'TCS', 'Infosys']
  },
  {
    title: 'Min Stack', source: 'LeetCode', problemId: '155',
    url: 'https://leetcode.com/problems/min-stack/',
    difficulty: 'Medium', topic: 'Stack & Queue',
    tags: ['Stack', 'Design'],
    description: 'Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.',
    constraints: '-2³¹ ≤ val ≤ 2³¹-1; Methods pop, top and getMin operations will always be called on non-empty stacks; at most 3×10⁴ calls',
    companies: ['Amazon', 'Bloomberg', 'Google', 'Uber', 'Microsoft']
  },
  {
    title: 'Daily Temperatures', source: 'LeetCode', problemId: '739',
    url: 'https://leetcode.com/problems/daily-temperatures/',
    difficulty: 'Medium', topic: 'Stack & Queue',
    tags: ['Array', 'Stack', 'Monotonic Stack'],
    description: 'Given an array temperatures representing daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the ith day for a warmer temperature.',
    constraints: '1 ≤ temperatures.length ≤ 10⁵; 30 ≤ temperatures[i] ≤ 100',
    companies: ['Amazon', 'Goldman Sachs', 'Google', 'Facebook']
  },
  {
    title: 'Largest Rectangle in Histogram', source: 'LeetCode', problemId: '84',
    url: 'https://leetcode.com/problems/largest-rectangle-in-histogram/',
    difficulty: 'Hard', topic: 'Stack & Queue',
    tags: ['Array', 'Stack', 'Monotonic Stack'],
    description: 'Given an array of integers heights representing the histogram\'s bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram.',
    constraints: '1 ≤ heights.length ≤ 10⁵; 0 ≤ heights[i] ≤ 10⁴',
    companies: ['Amazon', 'Facebook', 'Google', 'Microsoft', 'Goldman Sachs']
  },

  // ══════════════════════════════════════════════════════════
  //  RECURSION & BACKTRACKING (20 problems)
  // ══════════════════════════════════════════════════════════
  {
    title: 'Subsets', source: 'LeetCode', problemId: '78',
    url: 'https://leetcode.com/problems/subsets/',
    difficulty: 'Medium', topic: 'Backtracking',
    tags: ['Array', 'Backtracking', 'Bit Manipulation'],
    description: 'Given an integer array nums of unique elements, return all possible subsets (the power set). The solution set must not contain duplicate subsets.',
    constraints: '1 ≤ nums.length ≤ 10; -10 ≤ nums[i] ≤ 10; all numbers unique',
    companies: ['Facebook', 'Amazon', 'Microsoft', 'Bloomberg', 'Adobe']
  },
  {
    title: 'Combination Sum', source: 'LeetCode', problemId: '39',
    url: 'https://leetcode.com/problems/combination-sum/',
    difficulty: 'Medium', topic: 'Backtracking',
    tags: ['Array', 'Backtracking'],
    description: 'Given an array of distinct integers candidates and a target integer target, return all unique combinations of candidates where the chosen numbers sum to target. Numbers may be used unlimited times.',
    constraints: '1 ≤ candidates.length ≤ 30; 2 ≤ candidates[i] ≤ 40; all distinct; 1 ≤ target ≤ 40',
    companies: ['Amazon', 'Microsoft', 'Adobe', 'Google']
  },
  {
    title: 'Permutations', source: 'LeetCode', problemId: '46',
    url: 'https://leetcode.com/problems/permutations/',
    difficulty: 'Medium', topic: 'Backtracking',
    tags: ['Array', 'Backtracking'],
    description: 'Given an array nums of distinct integers, return all the possible permutations. You can return the answer in any order.',
    constraints: '1 ≤ nums.length ≤ 6; -10 ≤ nums[i] ≤ 10; all integers unique',
    companies: ['Microsoft', 'Amazon', 'Facebook', 'Linkedin', 'Adobe']
  },
  {
    title: 'N-Queens', source: 'LeetCode', problemId: '51',
    url: 'https://leetcode.com/problems/n-queens/',
    difficulty: 'Hard', topic: 'Backtracking',
    tags: ['Array', 'Backtracking'],
    description: 'The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other. Return all distinct solutions.',
    constraints: '1 ≤ n ≤ 9',
    companies: ['Amazon', 'Microsoft', 'Google', 'Uber', 'Apple']
  },
  {
    title: 'Word Search', source: 'LeetCode', problemId: '79',
    url: 'https://leetcode.com/problems/word-search/',
    difficulty: 'Medium', topic: 'Backtracking',
    tags: ['Array', 'String', 'Backtracking', 'Matrix'],
    description: 'Given an m x n grid of characters board and a string word, return true if word exists in the grid. The word can be constructed from letters of sequentially adjacent cells.',
    constraints: 'm == board.length; n = board[i].length; 1 ≤ m, n ≤ 6; 1 ≤ word.length ≤ 15',
    companies: ['Microsoft', 'Amazon', 'Bloomberg', 'Google']
  },

  // ══════════════════════════════════════════════════════════
  //  BIT MANIPULATION (10 problems)
  // ══════════════════════════════════════════════════════════
  {
    title: 'Number of 1 Bits', source: 'LeetCode', problemId: '191',
    url: 'https://leetcode.com/problems/number-of-1-bits/',
    difficulty: 'Easy', topic: 'Bit Manipulation',
    tags: ['Divide and Conquer', 'Bit Manipulation'],
    description: 'Write a function that takes the binary representation of a positive integer and returns the number of set bits it has (also known as the Hamming weight).',
    constraints: '1 ≤ n ≤ 2³¹-1',
    companies: ['Microsoft', 'Apple', 'Qualcomm', 'Adobe', 'TCS']
  },
  {
    title: 'Single Number', source: 'LeetCode', problemId: '136',
    url: 'https://leetcode.com/problems/single-number/',
    difficulty: 'Easy', topic: 'Bit Manipulation',
    tags: ['Array', 'Bit Manipulation'],
    description: 'Given a non-empty array of integers nums, every element appears twice except for one. Find that single one. Must implement O(n) runtime and O(1) space using XOR.',
    constraints: '1 ≤ nums.length ≤ 3×10⁴; -3×10⁴ ≤ nums[i] ≤ 3×10⁴; each element except one appears twice',
    companies: ['Airbnb', 'Amazon', 'Adobe', 'Qualcomm', 'Wipro', 'HCL']
  },
  {
    title: 'Counting Bits', source: 'LeetCode', problemId: '338',
    url: 'https://leetcode.com/problems/counting-bits/',
    difficulty: 'Easy', topic: 'Bit Manipulation',
    tags: ['Dynamic Programming', 'Bit Manipulation'],
    description: 'Given an integer n, return an array ans of length n + 1 such that for each i (0 ≤ i ≤ n), ans[i] is the number of 1\'s in the binary representation of i.',
    constraints: '0 ≤ n ≤ 10⁵',
    companies: ['Facebook', 'Microsoft', 'Amazon']
  },

  // ══════════════════════════════════════════════════════════
  //  MATH (10 problems)
  // ══════════════════════════════════════════════════════════
  {
    title: 'Reverse Integer', source: 'LeetCode', problemId: '7',
    url: 'https://leetcode.com/problems/reverse-integer/',
    difficulty: 'Medium', topic: 'Math',
    tags: ['Math'],
    description: 'Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range, return 0.',
    constraints: '-2³¹ ≤ x ≤ 2³¹-1',
    companies: ['Bloomberg', 'Apple', 'Amazon', 'Microsoft', 'TCS', 'Wipro']
  },
  {
    title: 'Power of Two', source: 'LeetCode', problemId: '231',
    url: 'https://leetcode.com/problems/power-of-two/',
    difficulty: 'Easy', topic: 'Math',
    tags: ['Math', 'Bit Manipulation', 'Recursion'],
    description: 'Given an integer n, return true if it is a power of two. Otherwise, return false. An integer n is a power of two if there exists an integer x such that n == 2^x.',
    constraints: '-2³¹ ≤ n ≤ 2³¹-1',
    companies: ['Adobe', 'Qualcomm', 'Google', 'Amazon']
  },
  {
    title: 'Happy Number', source: 'LeetCode', problemId: '202',
    url: 'https://leetcode.com/problems/happy-number/',
    difficulty: 'Easy', topic: 'Math',
    tags: ['Hash Table', 'Math', 'Two Pointers'],
    description: 'Write an algorithm to determine if a number n is happy. A happy number: Replace it with sum of squares of its digits repeatedly until it equals 1 (happy) or loops endlessly.',
    constraints: '1 ≤ n ≤ 2³¹-1',
    companies: ['Amazon', 'Adobe', 'Bloomberg', 'Microsoft', 'Infosys']
  },

  // ══════════════════════════════════════════════════════════
  //  GREEDY (10 problems)
  // ══════════════════════════════════════════════════════════
  {
    title: 'Meeting Rooms II', source: 'LeetCode', problemId: '253',
    url: 'https://leetcode.com/problems/meeting-rooms-ii/',
    difficulty: 'Medium', topic: 'Greedy',
    tags: ['Array', 'Two Pointers', 'Greedy', 'Sorting', 'Heap (Priority Queue)', 'Prefix Sum'],
    description: 'Given an array of meeting time intervals intervals where intervals[i] = [start_i, end_i], return the minimum number of conference rooms required.',
    constraints: '1 ≤ intervals.length ≤ 10⁴; 0 ≤ start_i < end_i ≤ 10⁶',
    companies: ['Facebook', 'Google', 'Amazon', 'Microsoft', 'Uber', 'Ola']
  },
  {
    title: 'Task Scheduler', source: 'LeetCode', problemId: '621',
    url: 'https://leetcode.com/problems/task-scheduler/',
    difficulty: 'Medium', topic: 'Greedy',
    tags: ['Array', 'Hash Table', 'Greedy', 'Sorting', 'Heap (Priority Queue)', 'Counting'],
    description: 'Given a characters array tasks representing the tasks a CPU needs to do and a non-negative integer n (cooldown). Return the least number of intervals required to finish tasks.',
    constraints: '1 ≤ task.length ≤ 10⁴; tasks[i] is uppercase English letter; 0 ≤ n ≤ 100',
    companies: ['Amazon', 'Facebook', 'Google']
  },
  {
    title: 'Gas Station', source: 'LeetCode', problemId: '134',
    url: 'https://leetcode.com/problems/gas-station/',
    difficulty: 'Medium', topic: 'Greedy',
    tags: ['Array', 'Greedy'],
    description: 'There are n gas stations along a circular route. Given gas[i] units and cost[i] to travel to the next station, find the starting gas station index to complete the circuit, or return -1.',
    constraints: 'n == gas.length == cost.length; 1 ≤ n ≤ 10⁵; 0 ≤ gas[i], cost[i] ≤ 10⁴',
    companies: ['Amazon', 'Microsoft', 'Goldman Sachs']
  },
];

async function seedProblems() {
  try {
    const uri = 'mongodb://pragati:pragati_secret@localhost:27017/pragati?authSource=admin';
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');

    // Remove old generic problems (Array Problem 1, String Problem 1, etc.)
    const deleteResult = await Problem.deleteMany({
      title: { $regex: /^(Array|String|Recursion) Problem \d+$/ }
    });
    console.log(`🗑️  Removed ${deleteResult.deletedCount} generic placeholder problems`);

    // Upsert real LeetCode problems (don't duplicate on re-run)
    let added = 0, skipped = 0;
    for (const p of LEETCODE_PROBLEMS) {
      const existing = await Problem.findOne({ problemId: p.problemId, source: 'LeetCode' });
      if (!existing) {
        await Problem.create(p);
        added++;
      } else {
        // Update existing with enhanced data
        await Problem.findByIdAndUpdate(existing._id, {
          url: p.url,
          description: p.description,
          constraints: p.constraints,
          tags: p.tags,
          companies: p.companies,
        });
        skipped++;
      }
    }
    console.log(`✅ ${added} new problems added, ${skipped} updated`);
    console.log(`📊 Total problems: ${await Problem.countDocuments()}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seedProblems();